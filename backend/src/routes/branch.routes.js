/**
 * Branch routes for tenant-scoped branch management.
 */

const { Router } = require("express");
const branchService = require("../services/branch.service");
const { success, created } = require("../utils/response");
const { authenticate } = require("../middleware/auth");
const { requireFirm } = require("../middleware/tenant");
const { requirePermission } = require("../middleware/permissions");
const { logActivity } = require("../middleware/activity");

const router = Router({ mergeParams: true });

router.use(authenticate, requireFirm);

// GET /api/firms/:firmId/branches
router.get("/", requirePermission("Settings.Manage"), async (req, res, next) => {
  try {
    const branches = await branchService.getByFirmId(req.activeFirmId);
    success(res, branches);
  } catch (err) { next(err); }
});

// GET /api/firms/:firmId/branches/:id
router.get("/:id", requirePermission("Settings.Manage"), async (req, res, next) => {
  try {
    const branch = await branchService.getById(req.params.id, req.activeFirmId);
    success(res, branch);
  } catch (err) { next(err); }
});

// POST /api/firms/:firmId/branches
router.post(
  "/",
  requirePermission("Settings.Manage"),
  logActivity("CREATE", "Branch"),
  async (req, res, next) => {
    try {
      const branch = await branchService.create(
        { ...req.body, firmId: req.activeFirmId },
        req.user.id
      );
      created(res, branch, "Branch created successfully");
    } catch (err) { next(err); }
  }
);

// PUT /api/firms/:firmId/branches/:id
router.put(
  "/:id",
  requirePermission("Settings.Manage"),
  logActivity("UPDATE", "Branch"),
  async (req, res, next) => {
    try {
      const branch = await branchService.update(req.params.id, req.body, req.activeFirmId, req.user.id);
      success(res, branch, "Branch updated successfully");
    } catch (err) { next(err); }
  }
);

// DELETE /api/firms/:firmId/branches/:id
router.delete(
  "/:id",
  requirePermission("Settings.Manage"),
  logActivity("DELETE", "Branch"),
  async (req, res, next) => {
    try {
      await branchService.delete(req.params.id, req.activeFirmId);
      success(res, null, "Branch deleted successfully");
    } catch (err) { next(err); }
  }
);

module.exports = router;
