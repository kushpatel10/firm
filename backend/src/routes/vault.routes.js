/**
 * Key Vault Express Routes (Disabled / No-op)
 * Encryption is disabled; returns safe mock status to avoid frontend/script breakage.
 */

const { Router } = require("express");
const { success } = require("../utils/response");
const { authenticate } = require("../middleware/auth");
const { requireFirm } = require("../middleware/tenant");

const router = Router({ mergeParams: true });

router.use(authenticate, requireFirm);

// GET /api/firms/:firmId/vault/status — Vault status is always unlocked/disabled
router.get("/status", (req, res) => {
  success(res, { unlocked: true, timeRemainingMs: 86400000, expiresAt: null });
});

// POST /api/firms/:firmId/vault/unlock — No-op
router.post("/unlock", (req, res) => {
  success(res, { unlocked: true }, "Encryption is disabled; data is plain text.");
});

// POST /api/firms/:firmId/vault/lock — No-op
router.post("/lock", (req, res) => {
  success(res, { unlocked: false }, "Vault lock no-op.");
});

// POST /api/firms/:firmId/vault/generate-keypair — No-op
router.post("/generate-keypair", (req, res) => {
  success(res, { message: "Encryption is disabled." });
});

module.exports = router;
