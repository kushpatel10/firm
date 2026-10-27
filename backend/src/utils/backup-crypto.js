/**
 * Hardened Cryptographic Engine for Firm Backups
 * Specification: Argon2id KDF + AES-256-GCM + Gzip + Canonical JSON (Format v2)
 */

const crypto = require("crypto");
const zlib = require("zlib");
const argon2 = require("argon2");
const stringify = require("fast-json-stable-stringify");

const KDF_CONFIG = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,        // 3 iterations
  parallelism: 4,     // 4 threads
  hashLength: 32,     // 256-bit AES key
};

/**
 * Derives a 256-bit symmetric key from passphrase and salt using Argon2id.
 * @param {string} passphrase
 * @param {Buffer} saltBuffer
 * @returns {Promise<Buffer>}
 */
async function deriveKey(passphrase, saltBuffer) {
  if (!passphrase || typeof passphrase !== "string") {
    throw new Error("Passphrase must be a non-empty string");
  }

  const hash = await argon2.hash(passphrase, {
    ...KDF_CONFIG,
    salt: saltBuffer,
    raw: true,
  });
  return hash;
}

/**
 * Encrypts data object into .firmbak envelope format v2.
 * @param {Object} dataObject
 * @param {string} passphrase
 * @returns {Promise<Object>} .firmbak envelope
 */
async function encryptBackupPayload(dataObject, passphrase) {
  // 1. Deterministic JSON serialization
  const canonicalJson = stringify(dataObject);

  // 2. Gzip compression
  const compressed = zlib.gzipSync(Buffer.from(canonicalJson, "utf8"));
  const compressedSha256 = crypto.createHash("sha256").update(compressed).digest("hex");

  // 3. Cryptographic primitives
  const salt = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
  const key = await deriveKey(passphrase, salt);

  // 4. AES-256-GCM encryption
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    magic: "FIRMBAK",
    formatVersion: 2,
    crypto: {
      kdf: "argon2id",
      kdfParams: {
        memoryCost: KDF_CONFIG.memoryCost,
        timeCost: KDF_CONFIG.timeCost,
        parallelism: KDF_CONFIG.parallelism,
      },
      salt: salt.toString("base64"),
      cipher: "aes-256-gcm",
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      compressedSha256,
    },
    payload: encrypted.toString("base64"),
  };
}

/**
 * Decrypts .firmbak envelope format v2. Fails immediately if key is wrong or data tampered.
 * @param {Object} envelope
 * @param {string} passphrase
 * @returns {Promise<Object>} Plaintext JSON object
 */
async function decryptBackupPayload(envelope, passphrase) {
  if (!envelope || typeof envelope !== "object") {
    throw new Error("Invalid backup container: envelope is missing or invalid");
  }
  if (envelope.magic !== "FIRMBAK") {
    throw new Error("Invalid backup container: unrecognized magic header");
  }
  if (envelope.formatVersion !== 2) {
    throw new Error(`Unsupported container format version: ${envelope.formatVersion}`);
  }
  if (!envelope.crypto || !envelope.payload) {
    throw new Error("Invalid backup container: missing cryptographic envelope or payload");
  }

  const { salt, iv, authTag, compressedSha256, kdfParams } = envelope.crypto;
  if (!salt || !iv || !authTag) {
    throw new Error("Invalid backup container: missing required cryptographic parameters");
  }

  const saltBuf = Buffer.from(salt, "base64");
  const ivBuf = Buffer.from(iv, "base64");
  const authTagBuf = Buffer.from(authTag, "base64");
  const ciphertextBuf = Buffer.from(envelope.payload, "base64");

  // 1. Re-derive key
  const key = await argon2.hash(passphrase, {
    type: argon2.argon2id,
    memoryCost: kdfParams?.memoryCost || KDF_CONFIG.memoryCost,
    timeCost: kdfParams?.timeCost || KDF_CONFIG.timeCost,
    parallelism: kdfParams?.parallelism || KDF_CONFIG.parallelism,
    hashLength: 32,
    salt: saltBuf,
    raw: true,
  });

  // 2. AES-256-GCM Decipher
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, ivBuf);
  decipher.setAuthTag(authTagBuf);

  let compressed;
  try {
    compressed = Buffer.concat([decipher.update(ciphertextBuf), decipher.final()]);
  } catch (err) {
    throw new Error("Decryption failed: invalid passphrase or corrupted/tampered file");
  }

  // 3. Checksum verification
  if (compressedSha256) {
    const actualHash = crypto.createHash("sha256").update(compressed).digest("hex");
    if (actualHash !== compressedSha256) {
      throw new Error("Integrity check failed: compressed SHA-256 checksum mismatch");
    }
  }

  // 4. Decompression
  let jsonStr;
  try {
    jsonStr = zlib.gunzipSync(compressed).toString("utf8");
  } catch (err) {
    throw new Error("Decompression failed: corrupted compressed payload stream");
  }

  return JSON.parse(jsonStr);
}

module.exports = {
  encryptBackupPayload,
  decryptBackupPayload,
  deriveKey,
  KDF_CONFIG,
};
