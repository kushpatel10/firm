/**
 * Concurrency-Safe Backup Scheduler & Advisory Lock Engine
 * Runs background cron jobs protected by PostgreSQL advisory transaction locks
 * to ensure zero duplicate executions across multiple backend worker processes.
 */

const cron = require("node-cron");
const prisma = require("../config/database");
const { exportFirmSnapshot } = require("./backup-export.service");
const { encryptBackupPayload } = require("../utils/backup-crypto");
const {
  getDriveClient,
  ensureBackupFolder,
  uploadAndVerifyBackup,
  pruneOldBackups,
} = require("./google-drive.service");

let scheduledTask = null;

/**
 * Initializes the background cron scheduler.
 */
function initScheduler() {
  if (scheduledTask) {
    return;
  }

  // Runs every 5 minutes
  scheduledTask = cron.schedule("*/5 * * * *", async () => {
    try {
      await runSchedulerCycle();
    } catch (err) {
      console.error("[Scheduler Error] Unexpected failure in scheduler cycle:", err);
    }
  });

  console.log("   Scheduler: Background automated backup daemon initialized (interval: 5m)");
}

/**
 * Evaluates all active firms for automated backup execution.
 */
async function runSchedulerCycle() {
  const activeConfigs = await prisma.firmBackupConfig.findMany({
    where: {
      autoBackupEnabled: true,
      googleRefreshToken: { not: null },
    },
    include: { firm: true },
  });

  if (!activeConfigs || activeConfigs.length === 0) {
    return;
  }

  const now = new Date();

  for (const config of activeConfigs) {
    try {
      // 1. Calculate time in firm's local timezone
      const localTime = new Intl.DateTimeFormat("en-US", {
        timeZone: config.timezone || "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);

      // Check if scheduled time matches
      if (localTime !== config.backupTime) {
        continue;
      }

      // Check if already executed successfully in the last 20 hours
      const threshold = new Date(Date.now() - 20 * 60 * 60 * 1000);
      if (
        config.lastBackupAt &&
        config.lastBackupAt > threshold &&
        config.lastBackupStatus === "SUCCESS"
      ) {
        continue;
      }

      // 2. Execute with PostgreSQL Advisory Lock inside transaction
      await prisma.$transaction(async (tx) => {
        const lockKey = `backup_${config.firmId}`;
        const [lockResult] = await tx.$queryRawUnsafe(
          `SELECT pg_try_advisory_xact_lock(hashtext($1)) as locked`,
          lockKey
        );

        if (!lockResult?.locked) {
          // Another worker instance holds the lock
          return;
        }

        await executeFirmBackup(config);
      });
    } catch (firmErr) {
      console.error(`[Scheduler] Error evaluating firm ${config.firmId}:`, firmErr);
    }
  }
}

/**
 * Executes a full backup cycle for a single firm configuration.
 * @param {Object} config - FirmBackupConfig record with included firm
 * @param {string|null} customPassphrase - Optional override passphrase
 * @param {boolean} uploadToDrive - Whether to upload to Google Drive
 * @returns {Promise<Object>} Result of backup
 */
async function executeFirmBackup(config, customPassphrase = null, uploadToDrive = true) {
  const startTime = Date.now();
  let backupRecord = null;
  const firmId = config.firmId;

  try {
    // 1. Snapshot export under REPEATABLE READ
    const snapshot = await exportFirmSnapshot(firmId);

    // 2. Create history audit record
    backupRecord = await prisma.backupHistory.create({
      data: {
        backupId: snapshot.backupId,
        firmId,
        actionType: uploadToDrive ? "AUTO_SCHEDULED" : "MANUAL_EXPORT",
        status: "RUNNING",
      },
    });

    // 3. Encrypt payload
    const passphrase =
      customPassphrase || config.firm.masterBusinessKey || config.firmId;
    const envelope = await encryptBackupPayload(snapshot, passphrase);
    const envelopeBuffer = Buffer.from(JSON.stringify(envelope, null, 2), "utf8");

    const fileSlug = (config.firm.name || "firm")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
    const dateStamp = new Date().toISOString().slice(0, 10);
    const idPrefix = snapshot.backupId.slice(0, 8);
    const fileName = `Firm_${fileSlug}_${dateStamp}_${idPrefix}.firmbak`;

    let driveFileId = null;

    // 4. Upload to Google Drive if requested
    if (uploadToDrive && config.googleRefreshToken) {
      await prisma.backupHistory.update({
        where: { id: backupRecord.id },
        data: { status: "UPLOADING" },
      });

      const driveClient = getDriveClient(config.googleRefreshToken);
      let folderId = config.googleFolderId;
      if (!folderId) {
        folderId = await ensureBackupFolder(driveClient);
        await prisma.firmBackupConfig.update({
          where: { firmId },
          data: { googleFolderId: folderId },
        });
      }

      await prisma.backupHistory.update({
        where: { id: backupRecord.id },
        data: { status: "VERIFYING" },
      });

      const driveFile = await uploadAndVerifyBackup(
        driveClient,
        folderId,
        fileName,
        envelopeBuffer
      );
      driveFileId = driveFile.id;

      // Prune old backups per retention policy
      await pruneOldBackups(driveClient, folderId, config.retentionDays || 30);
    }

    // 5. Mark SUCCESS
    const durationMs = Date.now() - startTime;
    await prisma.backupHistory.update({
      where: { id: backupRecord.id },
      data: {
        status: "SUCCESS",
        fileName,
        fileSizeBytes: envelopeBuffer.length,
        googleFileId: driveFileId,
        manifest: snapshot.manifest,
        durationMs,
      },
    });

    await prisma.firmBackupConfig.update({
      where: { firmId },
      data: {
        lastBackupAt: new Date(),
        lastBackupStatus: "SUCCESS",
        lastError: null,
      },
    });

    return {
      success: true,
      backupId: snapshot.backupId,
      fileName,
      fileBuffer: envelopeBuffer,
      fileSizeBytes: envelopeBuffer.length,
      manifest: snapshot.manifest,
      googleFileId: driveFileId,
      durationMs,
    };
  } catch (err) {
    const isAuthExpired =
      err.message?.includes("invalid_grant") ||
      err.message?.includes("401") ||
      err.message?.includes("unauthorized");

    const status = isAuthExpired ? "AUTH_EXPIRED" : "FAILED";

    if (backupRecord) {
      await prisma.backupHistory.update({
        where: { id: backupRecord.id },
        data: {
          status,
          errorMessage: err.message,
          durationMs: Date.now() - startTime,
        },
      });
    }

    await prisma.firmBackupConfig
      .update({
        where: { firmId },
        data: {
          lastBackupStatus: status,
          lastError: err.message,
        },
      })
      .catch(() => {});

    throw err;
  }
}

/**
 * Triggers an immediate backup for a specific firm.
 * Can either upload to connected Drive, generate a downloadable buffer, or both.
 */
async function triggerImmediateBackup(firmId, customPassphrase = null, uploadToDrive = false) {
  // Find or create backup config
  let config = await prisma.firmBackupConfig.findUnique({
    where: { firmId },
    include: { firm: true },
  });

  if (!config) {
    const firm = await prisma.firm.findUnique({ where: { id: firmId } });
    if (!firm) throw new Error("Firm not found");
    config = await prisma.firmBackupConfig.create({
      data: { firmId },
      include: { firm: true },
    });
  }

  return await executeFirmBackup(config, customPassphrase, uploadToDrive);
}

module.exports = {
  initScheduler,
  runSchedulerCycle,
  executeFirmBackup,
  triggerImmediateBackup,
};
