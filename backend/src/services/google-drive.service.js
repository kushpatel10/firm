/**
 * Google Drive Client & Post-Upload Verifier Service
 * Manages OAuth credentials, folder provisioning, resilient uploads,
 * MD5/size verification, file download, and automated retention pruning.
 */

const { google } = require("googleapis");
const crypto = require("crypto");
const stream = require("stream");
const config = require("../config/env");
const { decryptSecret, encryptSecret } = require("../utils/token-encryptor");

const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * Returns OAuth2 client instance.
 */
function createOAuth2Client(redirectUri = null) {
  const uri = redirectUri || config.googleRedirectUri;
  return new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    uri
  );
}

/**
 * Generates OAuth consent URL specifically for Google Drive file scope.
 * @param {string} firmId
 * @param {string} state - Optional state payload (JSON string or base64)
 * @param {string} redirectUri - Optional override for callback URI
 * @returns {string} Consent URL
 */
function getDriveAuthUrl(firmId, state = null, redirectUri = null) {
  const oauth2Client = createOAuth2Client(redirectUri);
  const statePayload = typeof state === "string" ? state : JSON.stringify({ firmId });

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // Force to ensure refresh_token is returned
    scope: DRIVE_SCOPES,
    state: statePayload,
  });
}

/**
 * Exchanges Google authorization code for refresh and access tokens.
 * @param {string} code
 * @param {string} redirectUri
 * @returns {Promise<{ refreshToken: string, googleEmail: string }>}
 */
async function exchangeDriveAuthCode(code, redirectUri = null) {
  const oauth2Client = createOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error(
      "No refresh token was returned by Google. If you already authorized the app, please disconnect and try again with prompt=consent."
    );
  }

  oauth2Client.setCredentials(tokens);

  // Retrieve user email
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  const googleEmail = userInfo.data.email || null;

  return {
    refreshToken: tokens.refresh_token,
    encryptedRefreshToken: encryptSecret(tokens.refresh_token),
    googleEmail,
  };
}

/**
 * Instantiates an authorized Google Drive API client using the firm's encrypted refresh token.
 * @param {string} encryptedRefreshToken
 * @returns {google.drive}
 */
function getDriveClient(encryptedRefreshToken) {
  if (!encryptedRefreshToken) {
    throw new Error("Cannot initialize Google Drive client: missing refresh token");
  }

  const rawRefreshToken = decryptSecret(encryptedRefreshToken);
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: rawRefreshToken });

  return google.drive({ version: "v3", auth: oauth2Client });
}

/**
 * Ensures that the root "Firm Backups" folder exists in the user's Drive.
 * @param {google.drive} driveClient
 * @returns {Promise<string>} folderId
 */
async function ensureBackupFolder(driveClient) {
  const folderName = "Firm Backups";

  // Check if exists and not trashed
  const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`;
  const res = await driveClient.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  // Create folder
  const folderMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };

  const createRes = await driveClient.files.create({
    requestBody: folderMetadata,
    fields: "id",
  });

  return createRes.data.id;
}

/**
 * Uploads a backup file buffer and performs post-upload integrity verification.
 * Asserts size equality and MD5 checksum matches Google Drive's calculation.
 *
 * @param {google.drive} driveClient
 * @param {string} folderId
 * @param {string} fileName
 * @param {Buffer} fileBuffer
 * @returns {Promise<Object>} Verified file resource
 */
async function uploadAndVerifyBackup(driveClient, folderId, fileName, fileBuffer) {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error("A valid Buffer is required for backup upload");
  }

  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  // 1. Upload
  const uploadRes = await driveClient.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
      mimeType: "application/json",
      description: "Encrypted Firm System Backup (.firmbak)",
    },
    media: {
      mimeType: "application/json",
      body: bufferStream,
    },
    fields: "id, name, size, md5Checksum, createdTime",
  });

  const file = uploadRes.data;

  // 2. Post-Upload Verification
  const expectedSize = fileBuffer.length;
  const actualSize = parseInt(file.size, 10);
  if (actualSize !== expectedSize) {
    throw new Error(
      `Upload size mismatch: expected ${expectedSize} bytes, Drive recorded ${actualSize} bytes`
    );
  }

  const expectedMd5 = crypto.createHash("md5").update(fileBuffer).digest("hex");
  if (file.md5Checksum && file.md5Checksum !== expectedMd5) {
    throw new Error(
      `Upload checksum mismatch: local MD5 was ${expectedMd5}, but Drive computed ${file.md5Checksum}`
    );
  }

  return file;
}

/**
 * Lists available .firmbak files in the firm's backup folder.
 * @param {google.drive} driveClient
 * @param {string} folderId
 * @returns {Promise<Array<Object>>}
 */
async function listBackupFiles(driveClient, folderId) {
  if (!folderId) return [];

  const query = `'${folderId}' in parents and trashed = false and name contains '.firmbak'`;
  const res = await driveClient.files.list({
    q: query,
    orderBy: "createdTime desc",
    fields: "files(id, name, size, md5Checksum, createdTime)",
    pageSize: 50,
  });

  return (res.data.files || []).map((f) => ({
    id: f.id,
    name: f.name,
    size: parseInt(f.size || "0", 10),
    md5Checksum: f.md5Checksum,
    createdAt: f.createdTime,
  }));
}

/**
 * Downloads a backup file from Google Drive as a Buffer.
 * @param {google.drive} driveClient
 * @param {string} fileId
 * @returns {Promise<Buffer>}
 */
async function downloadBackupFile(driveClient, fileId) {
  const res = await driveClient.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );

  return Buffer.from(res.data);
}

/**
 * Prunes backups older than retentionDays.
 * @param {google.drive} driveClient
 * @param {string} folderId
 * @param {number} retentionDays
 */
async function pruneOldBackups(driveClient, folderId, retentionDays = 30) {
  if (!folderId || retentionDays <= 0) return;

  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const query = `'${folderId}' in parents and trashed = false and createdTime < '${cutoffDate}'`;

  const res = await driveClient.files.list({
    q: query,
    fields: "files(id, name, createdTime)",
  });

  for (const file of res.data.files || []) {
    try {
      await driveClient.files.delete({ fileId: file.id });
    } catch {
      // Continue pruning remaining files even if one fails
    }
  }
}

module.exports = {
  createOAuth2Client,
  getDriveAuthUrl,
  exchangeDriveAuthCode,
  getDriveClient,
  ensureBackupFolder,
  uploadAndVerifyBackup,
  listBackupFiles,
  downloadBackupFile,
  pruneOldBackups,
};
