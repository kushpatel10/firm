/**
 * Backup and Cloud Synchronization Routes
 * Exposes API endpoints for Google Drive OAuth, scheduled backups,
 * manual exports, dry-run inspections, and transactional restores.
 */

const { Router } = require("express");
const multer = require("multer");
const prisma = require("../config/database");
const { authenticate } = require("../middleware/auth");
const { requireFirm } = require("../middleware/tenant");
const { logActivity } = require("../middleware/activity");
const { success, created, paginated, error } = require("../utils/response");
const { ValidationError, UnauthorizedError, ForbiddenError } = require("../utils/errors");

const {
  getDriveAuthUrl,
  exchangeDriveAuthCode,
  getDriveClient,
  ensureBackupFolder,
  listBackupFiles,
  downloadBackupFile,
} = require("../services/google-drive.service");

const {
  triggerImmediateBackup,
} = require("../services/scheduler.service");

const {
  exportFirmSnapshot,
} = require("../services/backup-export.service");

const {
  encryptBackupPayload,
  decryptBackupPayload,
} = require("../utils/backup-crypto");

const {
  validateSnapshotIntegrity,
  migrateSnapshot,
} = require("../services/backup-validator.service");

const {
  restoreFirmData,
} = require("../services/backup-restore.service");

// Configure Multer for in-memory file uploads (max 50 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router({ mergeParams: true });

// Require authentication and tenant access
router.use(authenticate, requireFirm);

/**
 * Helper to parse envelope from either uploaded file, raw JSON body, or Drive file ID.
 */
async function parseEnvelopeFromRequest(req) {
  let envelope = null;

  if (req.file && req.file.buffer) {
    try {
      envelope = JSON.parse(req.file.buffer.toString("utf8"));
    } catch {
      throw new ValidationError("Uploaded file is not a valid JSON .firmbak container");
    }
  } else if (req.body.envelope) {
    envelope = typeof req.body.envelope === "string" ? JSON.parse(req.body.envelope) : req.body.envelope;
  } else if (req.body.fileId) {
    // Download directly from Google Drive
    const config = await prisma.firmBackupConfig.findUnique({
      where: { firmId: req.activeFirmId },
    });
    if (!config?.googleRefreshToken) {
      throw new ValidationError("Google Drive is not linked for this firm");
    }
    const driveClient = getDriveClient(config.googleRefreshToken);
    const buffer = await downloadBackupFile(driveClient, req.body.fileId);
    try {
      envelope = JSON.parse(buffer.toString("utf8"));
    } catch {
      throw new ValidationError("Downloaded file from Google Drive is not a valid .firmbak container");
    }
  } else {
    throw new ValidationError("No backup file or envelope provided");
  }

  return envelope;
}

// ──────────────────────────────────────────────
// 1. Backup Configuration
// ──────────────────────────────────────────────

// GET /api/firms/:firmId/backup/config
router.get("/config", async (req, res, next) => {
  try {
    let config = await prisma.firmBackupConfig.findUnique({
      where: { firmId: req.activeFirmId },
    });

    if (!config) {
      config = await prisma.firmBackupConfig.create({
        data: { firmId: req.activeFirmId },
      });
    }

    success(res, {
      isConnected: Boolean(config.googleRefreshToken),
      googleEmail: config.googleEmail,
      googleFolderId: config.googleFolderId,
      autoBackupEnabled: config.autoBackupEnabled,
      backupTime: config.backupTime,
      timezone: config.timezone,
      retentionDays: config.retentionDays,
      lastBackupAt: config.lastBackupAt,
      lastBackupStatus: config.lastBackupStatus,
      lastError: config.lastError,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/firms/:firmId/backup/config
router.put("/config", logActivity("UPDATE", "BackupConfig"), async (req, res, next) => {
  try {
    const { autoBackupEnabled, backupTime, timezone, retentionDays } = req.body;

    const updated = await prisma.firmBackupConfig.upsert({
      where: { firmId: req.activeFirmId },
      create: {
        firmId: req.activeFirmId,
        autoBackupEnabled: Boolean(autoBackupEnabled),
        backupTime: backupTime || "02:00",
        timezone: timezone || "Asia/Kolkata",
        retentionDays: parseInt(retentionDays, 10) || 30,
      },
      update: {
        ...(autoBackupEnabled !== undefined && { autoBackupEnabled: Boolean(autoBackupEnabled) }),
        ...(backupTime && { backupTime }),
        ...(timezone && { timezone }),
        ...(retentionDays && { retentionDays: parseInt(retentionDays, 10) }),
      },
    });

    success(res, {
      isConnected: Boolean(updated.googleRefreshToken),
      googleEmail: updated.googleEmail,
      autoBackupEnabled: updated.autoBackupEnabled,
      backupTime: updated.backupTime,
      timezone: updated.timezone,
      retentionDays: updated.retentionDays,
      lastBackupAt: updated.lastBackupAt,
      lastBackupStatus: updated.lastBackupStatus,
    }, "Backup settings updated successfully");
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// 2. Google Drive OAuth Lifecycle
// ──────────────────────────────────────────────

// GET /api/firms/:firmId/backup/google/auth-url
router.get("/google/auth-url", (req, res) => {
  const returnUrl = req.query.returnUrl || null;
  const redirectUri = req.query.redirectUri || null;
  const state = JSON.stringify({ firmId: req.activeFirmId, returnUrl });
  const authUrl = getDriveAuthUrl(req.activeFirmId, state, redirectUri);
  success(res, { authUrl });
});

// POST /api/firms/:firmId/backup/google/callback
router.post("/google/callback", logActivity("CONNECT", "GoogleDrive"), async (req, res, next) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) throw new ValidationError("Authorization code is required");

    const { encryptedRefreshToken, googleEmail } = await exchangeDriveAuthCode(
      code,
      redirectUri
    );

    // Initialize client and provision "Firm Backups" folder
    const driveClient = getDriveClient(encryptedRefreshToken);
    const folderId = await ensureBackupFolder(driveClient);

    const updatedConfig = await prisma.firmBackupConfig.upsert({
      where: { firmId: req.activeFirmId },
      create: {
        firmId: req.activeFirmId,
        googleEmail,
        googleRefreshToken: encryptedRefreshToken,
        googleFolderId: folderId,
        autoBackupEnabled: true,
      },
      update: {
        googleEmail,
        googleRefreshToken: encryptedRefreshToken,
        googleFolderId: folderId,
        lastError: null,
      },
    });

    success(res, {
      isConnected: true,
      googleEmail: updatedConfig.googleEmail,
      googleFolderId: updatedConfig.googleFolderId,
      autoBackupEnabled: updatedConfig.autoBackupEnabled,
    }, "Google Drive successfully connected!");
  } catch (err) {
    next(err);
  }
});

// POST /api/firms/:firmId/backup/google/disconnect
router.post("/google/disconnect", logActivity("DISCONNECT", "GoogleDrive"), async (req, res, next) => {
  try {
    await prisma.firmBackupConfig.update({
      where: { firmId: req.activeFirmId },
      data: {
        googleRefreshToken: null,
        googleEmail: null,
        googleFolderId: null,
        autoBackupEnabled: false,
        lastBackupStatus: null,
        lastError: null,
      },
    });

    success(res, { isConnected: false }, "Google Drive disconnected");
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// 3. Manual Immediate Backup Export
// ──────────────────────────────────────────────

// POST /api/firms/:firmId/backup/export-now
router.post("/export-now", logActivity("EXPORT", "Backup"), async (req, res, next) => {
  try {
    const { passphrase, uploadToDrive = false, download = false } = req.body;

    const result = await triggerImmediateBackup(
      req.activeFirmId,
      passphrase || null,
      Boolean(uploadToDrive)
    );

    if (download && result.fileBuffer) {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
      return res.send(result.fileBuffer);
    }

    success(res, {
      backupId: result.backupId,
      fileName: result.fileName,
      fileSizeBytes: result.fileSizeBytes,
      googleFileId: result.googleFileId,
      manifest: result.manifest,
      durationMs: result.durationMs,
    }, "Backup generated successfully!");
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// 4. Drive Files Listing & Download
// ──────────────────────────────────────────────

// GET /api/firms/:firmId/backup/drive-files
router.get("/drive-files", async (req, res, next) => {
  try {
    const config = await prisma.firmBackupConfig.findUnique({
      where: { firmId: req.activeFirmId },
    });

    if (!config?.googleRefreshToken) {
      return success(res, { files: [], isConnected: false });
    }

    const driveClient = getDriveClient(config.googleRefreshToken);
    const folderId = config.googleFolderId || (await ensureBackupFolder(driveClient));
    const files = await listBackupFiles(driveClient, folderId);

    success(res, { files, isConnected: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/firms/:firmId/backup/drive-files/:fileId/download
router.get("/drive-files/:fileId/download", async (req, res, next) => {
  try {
    const config = await prisma.firmBackupConfig.findUnique({
      where: { firmId: req.activeFirmId },
    });

    if (!config?.googleRefreshToken) {
      throw new ValidationError("Google Drive is not linked");
    }

    const driveClient = getDriveClient(config.googleRefreshToken);
    const buffer = await downloadBackupFile(driveClient, req.params.fileId);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="backup_${req.params.fileId}.firmbak"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// 5. Pre-Restore Dry-Run Verification
// ──────────────────────────────────────────────

// POST /api/firms/:firmId/backup/verify
router.post("/verify", upload.single("backupFile"), async (req, res, next) => {
  try {
    const passphrase = req.body.passphrase;
    if (!passphrase) {
      throw new ValidationError("Backup passphrase is required for decryption");
    }

    const envelope = await parseEnvelopeFromRequest(req);

    // Decrypt and verify payload
    let snapshot;
    try {
      snapshot = await decryptBackupPayload(envelope, passphrase);
    } catch (cryptoErr) {
      return error(res, cryptoErr.message, 400);
    }

    // Run migrations and validate integrity
    const migrated = migrateSnapshot(snapshot);
    const validation = validateSnapshotIntegrity(migrated);

    success(res, {
      verified: true,
      firmName: validation.firmName,
      createdAt: validation.createdAt,
      manifest: validation.manifest,
      schemaVersion: validation.schemaVersion,
      isCompatible: validation.isCompatible,
      warnings: validation.warnings,
      errors: validation.errors,
      isValid: validation.isValid,
    }, "Backup authenticated and verified successfully");
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// 6. Transactional Restoration
// ──────────────────────────────────────────────

// POST /api/firms/:firmId/backup/restore
router.post("/restore", upload.single("backupFile"), logActivity("RESTORE", "Firm"), async (req, res, next) => {
  try {
    const { passphrase, mode = "NEW_FIRM" } = req.body;
    if (!passphrase) {
      throw new ValidationError("Backup passphrase is required for restoration");
    }

    if (mode !== "NEW_FIRM" && mode !== "OVERWRITE") {
      throw new ValidationError("Mode must be either 'NEW_FIRM' or 'OVERWRITE'");
    }

    const envelope = await parseEnvelopeFromRequest(req);
    const snapshot = await decryptBackupPayload(envelope, passphrase);

    const result = await restoreFirmData(
      snapshot,
      mode,
      req.user.id,
      mode === "OVERWRITE" ? req.activeFirmId : null
    );

    created(res, result, `Restoration complete (${mode === "NEW_FIRM" ? "Cloned as New Firm" : "Overwrote Current Firm"})`);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// 7. Audit History
// ──────────────────────────────────────────────

// GET /api/firms/:firmId/backup/history
router.get("/history", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 20, 100);
    const skip = (page - 1) * pageSize;

    const [histories, total] = await Promise.all([
      prisma.backupHistory.findMany({
        where: { firmId: req.activeFirmId },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.backupHistory.count({
        where: { firmId: req.activeFirmId },
      }),
    ]);

    paginated(res, histories, total, page, pageSize);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
