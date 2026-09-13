/**
 * Key Vault Express Routes
 * Manage ephemeral RAM vault unlocking, locking, and status.
 */

const { Router } = require("express");
const keyVaultService = require("../services/key-vault.service");
const asymmetricCrypto = require("../utils/asymmetric-crypto");
const prisma = require("../config/database");
const { success, error } = require("../utils/response");
const { authenticate } = require("../middleware/auth");
const { requireFirm } = require("../middleware/tenant");
const { requirePermission } = require("../middleware/permissions");

const router = Router({ mergeParams: true });

// All vault routes require authentication and firm-level access
router.use(authenticate, requireFirm);

// GET /api/firms/:firmId/vault/status — Check vault status
router.get("/status", (req, res) => {
  const firmId = req.activeFirmId || req.params.firmId;
  const status = keyVaultService.getStatus(firmId);
  success(res, status);
});

// POST /api/firms/:firmId/vault/unlock — Unlock RAM vault with private key
router.post("/unlock", requirePermission("Settings.Manage"), async (req, res, next) => {
  try {
    const firmId = req.activeFirmId || req.params.firmId;
    const { privateKey, ttlHours } = req.body;

    if (!privateKey) {
      return error(res, "Private Key in PEM format is required.", 400);
    }

    const firm = await prisma.firm.findUnique({
      where: { id: firmId },
      select: { id: true, masterBusinessKey: true },
    });

    if (!firm) {
      return error(res, "Firm not found.", 404);
    }

    // Verify private key format & test decryption if public key exists
    if (firm.masterBusinessKey) {
      try {
        const testEncrypted = asymmetricCrypto.encryptWithPublicKey("TEST_STRING", firm.masterBusinessKey);
        const decrypted = asymmetricCrypto.decryptWithPrivateKey(testEncrypted, privateKey);
        if (decrypted !== "TEST_STRING") {
          return error(res, "Invalid Private Key for this Firm.", 400);
        }
      } catch (e) {
        return error(res, "Invalid Private Key format or decryption failed.", 400);
      }
    }

    const duration = parseInt(ttlHours) || 48;
    const result = keyVaultService.unlockVault(firmId, privateKey, duration);
    success(res, result, `Vault unlocked in ephemeral RAM for ${duration} hours.`);
  } catch (err) {
    next(err);
  }
});

// POST /api/firms/:firmId/vault/lock — Immediately purge private key from RAM
router.post("/lock", requirePermission("Settings.Manage"), (req, res) => {
  const firmId = req.activeFirmId || req.params.firmId;
  keyVaultService.lockVault(firmId);
  success(res, { unlocked: false }, "Vault key purged from RAM.");
});

// POST /api/firms/:firmId/vault/generate-keypair — Generate keypair for firm
router.post("/generate-keypair", requirePermission("Settings.Manage"), async (req, res, next) => {
  try {
    const firmId = req.activeFirmId || req.params.firmId;
    const keyPair = await asymmetricCrypto.generateFirmKeyPairAsync();

    // Store ONLY the Public Key in the database
    await prisma.firm.update({
      where: { id: firmId },
      data: { masterBusinessKey: keyPair.publicKeyPem },
    });

    // Automatically unlock vault in RAM for 48 hours for immediate use
    keyVaultService.unlockVault(firmId, keyPair.privateKeyPem, 48);

    // Return Private Key ONCE for owner to download/save safely
    success(res, {
      publicKey: keyPair.publicKeyPem,
      privateKey: keyPair.privateKeyPem,
      message: "Keypair generated! Save your Private Key safely. The database ONLY stores the Public Key.",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
