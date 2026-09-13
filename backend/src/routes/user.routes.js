/**
 * User routes.
 */

const { Router } = require("express");
const userService = require("../services/user.service");
const { success, created, paginated } = require("../utils/response");
const { authenticate, requireSuperAdmin } = require("../middleware/auth");
const { requireFirm } = require("../middleware/tenant");
const { requirePermission } = require("../middleware/permissions");
const { logActivity } = require("../middleware/activity");
const userCache = require("../utils/user-cache");

const router = Router();

router.use(authenticate);

// GET /api/users — Super Admin: all users
router.get("/", requireSuperAdmin, async (req, res, next) => {
  try {
    const { page, pageSize, search, status } = req.query;
    const result = await userService.getAll({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      search, status,
    });
    paginated(res, result.users, result.total, result.page, result.pageSize);
  } catch (err) { next(err); }
});

// GET /api/users/firm/:firmId — Users in a firm
router.get("/firm/:firmId", requireFirm, async (req, res, next) => {
  try {
    const { page, pageSize, search } = req.query;
    const result = await userService.getByFirmId(req.params.firmId, {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      search,
    });
    paginated(res, result.users, result.total, result.page, result.pageSize);
  } catch (err) { next(err); }
});

// POST /api/users/firm/:firmId/invite — Invite/assign user to firm (Requires Users.Manage)
router.post(
  "/firm/:firmId/invite",
  requireFirm,
  requirePermission("Users.Manage"),
  logActivity("INVITE", "User"),
  async (req, res, next) => {
    try {
      const assignment = await userService.inviteToFirm(req.params.firmId, req.body, req.user.id);
      if (assignment?.userId) {
        userCache.invalidate(assignment.userId);
      }
      created(res, assignment, "User invited to firm successfully");
    } catch (err) { next(err); }
  }
);

// GET /api/users/:id
router.get("/:id", async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    success(res, user);
  } catch (err) { next(err); }
});

// POST /api/users — Create user (Super Admin)
router.post("/", requireSuperAdmin, logActivity("CREATE", "User"), async (req, res, next) => {
  try {
    const user = await userService.create(req.body, req.user.id);
    created(res, user, "User created successfully");
  } catch (err) { next(err); }
});

// PUT /api/users/:id
router.put("/:id", requireSuperAdmin, logActivity("UPDATE", "User"), async (req, res, next) => {
  try {
    const user = await userService.update(req.params.id, req.body, req.user.id);
    userCache.invalidate(req.params.id);
    success(res, user, "User updated successfully");
  } catch (err) { next(err); }
});

// PATCH /api/users/:id/deactivate
router.patch("/:id/deactivate", requireSuperAdmin, logActivity("DEACTIVATE", "User"), async (req, res, next) => {
  try {
    const user = await userService.deactivate(req.params.id, req.user.id);
    userCache.invalidate(req.params.id);
    success(res, user, "User deactivated");
  } catch (err) { next(err); }
});

// POST /api/users/:id/reassign
router.post("/:id/reassign", requireSuperAdmin, logActivity("REASSIGN", "User"), async (req, res, next) => {
  try {
    const assignment = await userService.reassign(req.params.id, req.body);
    userCache.invalidate(req.params.id);
    success(res, assignment, "User reassigned successfully");
  } catch (err) { next(err); }
});

module.exports = router;
