/**
 * Role & Permission routes.
 */

const { Router } = require("express");
const roleService = require("../services/role.service");
const { success, created } = require("../utils/response");
const { authenticate, requireSuperAdmin } = require("../middleware/auth");
const { logActivity } = require("../middleware/activity");
const userCache = require("../utils/user-cache");

const router = Router();

router.use(authenticate);

// GET /api/roles
router.get("/", async (req, res, next) => {
  try {
    const { firmId, includeSystem } = req.query;
    const roles = await roleService.getAll({
      firmId, includeSystem: includeSystem !== "false",
    });
    success(res, roles);
  } catch (err) { next(err); }
});

// GET /api/roles/permissions — All available permissions
router.get("/permissions", async (req, res, next) => {
  try {
    const permissions = await roleService.getPermissions();
    success(res, permissions);
  } catch (err) { next(err); }
});

// GET /api/roles/:id
router.get("/:id", async (req, res, next) => {
  try {
    const role = await roleService.getById(req.params.id);
    success(res, role);
  } catch (err) { next(err); }
});

// POST /api/roles
router.post("/", requireSuperAdmin, logActivity("CREATE", "Role"), async (req, res, next) => {
  try {
    const role = await roleService.create(req.body, req.user.id);
    created(res, role, "Role created successfully");
  } catch (err) { next(err); }
});

// PUT /api/roles/:id
router.put("/:id", requireSuperAdmin, logActivity("UPDATE", "Role"), async (req, res, next) => {
  try {
    const role = await roleService.update(req.params.id, req.body, req.user.id);
    userCache.clear();
    success(res, role, "Role updated successfully");
  } catch (err) { next(err); }
});

// DELETE /api/roles/:id
router.delete("/:id", requireSuperAdmin, logActivity("DELETE", "Role"), async (req, res, next) => {
  try {
    await roleService.delete(req.params.id);
    userCache.clear();
    success(res, null, "Role deleted successfully");
  } catch (err) { next(err); }
});

// PUT /api/roles/:id/permissions — Assign permissions
router.put("/:id/permissions", requireSuperAdmin, logActivity("UPDATE_PERMISSIONS", "Role"), async (req, res, next) => {
  try {
    const role = await roleService.assignPermissions(req.params.id, req.body.permissionIds);
    userCache.clear();
    success(res, role, "Permissions updated");
  } catch (err) { next(err); }
});

module.exports = router;
