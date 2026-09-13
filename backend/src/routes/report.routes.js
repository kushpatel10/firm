/**
 * Report routes for firm aggregated analytics.
 */

const { Router } = require("express");
const reportService = require("../services/report.service");
const { success } = require("../utils/response");
const { authenticate } = require("../middleware/auth");
const { requireFirm } = require("../middleware/tenant");
const { requirePermission } = require("../middleware/permissions");

const router = Router({ mergeParams: true });

router.use(authenticate, requireFirm);

// GET /api/firms/:firmId/reports/sales
router.get("/sales", requirePermission("Reports.View"), async (req, res, next) => {
  try {
    const report = await reportService.getSalesReport(req.activeFirmId, req.query);
    success(res, report);
  } catch (err) { next(err); }
});

// GET /api/firms/:firmId/reports/purchases
router.get("/purchases", requirePermission("Reports.View"), async (req, res, next) => {
  try {
    const report = await reportService.getPurchaseReport(req.activeFirmId, req.query);
    success(res, report);
  } catch (err) { next(err); }
});

// GET /api/firms/:firmId/reports/expenses
router.get("/expenses", requirePermission("Reports.View"), async (req, res, next) => {
  try {
    const report = await reportService.getExpenseReport(req.activeFirmId, req.query);
    success(res, report);
  } catch (err) { next(err); }
});

// GET /api/firms/:firmId/reports/inventory
router.get("/inventory", requirePermission("Reports.View"), async (req, res, next) => {
  try {
    const report = await reportService.getInventoryReport(req.activeFirmId, req.query);
    success(res, report);
  } catch (err) { next(err); }
});

module.exports = router;
