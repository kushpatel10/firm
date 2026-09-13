/**
 * Dashboard routes for firm dashboard & admin dashboard endpoints.
 */

const { Router } = require("express");
const dashboardService = require("../services/dashboard.service");
const { success } = require("../utils/response");
const { authenticate, requireSuperAdmin } = require("../middleware/auth");
const { requireFirm } = require("../middleware/tenant");

const router = Router({ mergeParams: true });

// GET /api/firms/:firmId/summary & /api/firm/:firmId/summary — Firm Dashboard Summary
const handleFirmSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getFirmSummary(req.activeFirmId);
    success(res, summary);
  } catch (err) { next(err); }
};

router.get("/firms/:firmId/summary", authenticate, requireFirm, handleFirmSummary);
router.get("/firm/:firmId/summary", authenticate, requireFirm, handleFirmSummary);

// GET /api/admin/dashboard/summary — Admin Dashboard Summary (Super Admin)
router.get("/admin/summary", authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const summary = await dashboardService.getAdminSummary();
    success(res, summary);
  } catch (err) { next(err); }
});

module.exports = router;
