/**
 * Activity Log routes.
 */

const { Router } = require("express");
const activityService = require("../services/activity.service");
const { success, paginated } = require("../utils/response");
const { authenticate, requireSuperAdmin } = require("../middleware/auth");
const { requireFirm } = require("../middleware/tenant");

const router = Router();

router.use(authenticate);

// GET /api/activity — All logs (Super Admin)
router.get("/", requireSuperAdmin, async (req, res, next) => {
  try {
    const { page, pageSize, action, userId, firmId } = req.query;
    const result = await activityService.getAll({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 50,
      action, userId, firmId,
    });
    paginated(res, result.logs, result.total, result.page, result.pageSize);
  } catch (err) { next(err); }
});

// GET /api/activity/firm/:firmId — Firm activity (requires firm membership or super admin)
router.get("/firm/:firmId", requireFirm, async (req, res, next) => {
  try {
    const { page, pageSize, action } = req.query;
    const result = await activityService.getByFirmId(req.params.firmId, {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 50,
      action,
    });
    paginated(res, result.logs, result.total, result.page, result.pageSize);
  } catch (err) { next(err); }
});

module.exports = router;
