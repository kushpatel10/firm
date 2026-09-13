/**
 * Firm routes.
 */

const { Router } = require("express");
const firmService = require("../services/firm.service");
const { success, created, paginated } = require("../utils/response");
const { authenticate, requireSuperAdmin } = require("../middleware/auth");
const { ForbiddenError } = require("../utils/errors");
const { logActivity } = require("../middleware/activity");

const router = Router();

// All firm routes require authentication
router.use(authenticate);

/**
 * Require Super Admin OR access to the specific firm matching req.params.id or req.params.firmId.
 */
function requireFirmAccessOrSuperAdmin(permission = null) {
  return (req, res, next) => {
    if (req.user?.isSuperAdmin) {
      return next();
    }
    const targetFirmId = req.params.id || req.params.firmId;
    if (req.firmId && req.firmId === targetFirmId) {
      if (permission && (!req.permissions || !req.permissions.includes(permission))) {
        return next(new ForbiddenError(`Permission denied. Required: ${permission}`));
      }
      return next();
    }
    return next(new ForbiddenError("Access denied to this firm's resources"));
  };
}

// GET /api/firms — Super Admin only
router.get("/", requireSuperAdmin, async (req, res, next) => {
  try {
    const { page, pageSize, search, status } = req.query;
    const result = await firmService.getAll({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      search, status,
    });
    paginated(res, result.firms, result.total, result.page, result.pageSize);
  } catch (err) { next(err); }
});

// GET /api/firms/:id — Super Admin or assigned firm user
router.get("/:id", requireFirmAccessOrSuperAdmin("Settings.Manage"), async (req, res, next) => {
  try {
    const firm = await firmService.getById(req.params.id);
    success(res, firm);
  } catch (err) { next(err); }
});

// POST /api/firms — Super Admin only
router.post("/", requireSuperAdmin, logActivity("CREATE", "Firm"), async (req, res, next) => {
  try {
    const firm = await firmService.create(req.body, req.user.id);
    created(res, firm, "Firm created successfully");
  } catch (err) { next(err); }
});

// PUT /api/firms/:id — Super Admin or assigned firm user
router.put("/:id", requireFirmAccessOrSuperAdmin("Settings.Manage"), logActivity("UPDATE", "Firm"), async (req, res, next) => {
  try {
    const firm = await firmService.update(req.params.id, req.body, req.user.id);
    success(res, firm, "Firm updated successfully");
  } catch (err) { next(err); }
});

// PATCH /api/firms/:id/archive — Super Admin only
router.patch("/:id/archive", requireSuperAdmin, logActivity("ARCHIVE", "Firm"), async (req, res, next) => {
  try {
    const firm = await firmService.archive(req.params.id, req.user.id);
    success(res, firm, "Firm archived successfully");
  } catch (err) { next(err); }
});

// DELETE /api/firms/:id — Super Admin only
router.delete("/:id", requireSuperAdmin, logActivity("DELETE", "Firm"), async (req, res, next) => {
  try {
    await firmService.delete(req.params.id);
    success(res, null, "Firm deleted successfully");
  } catch (err) { next(err); }
});

module.exports = router;
