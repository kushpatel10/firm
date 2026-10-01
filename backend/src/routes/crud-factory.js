/**
 * Generic CRUD route factory for tenant-scoped entities.
 * Reduces boilerplate for Sales, Purchases, Expenses, etc.
 */

const { Router } = require("express");
const { success, created, paginated } = require("../utils/response");
const { authenticate } = require("../middleware/auth");
const { requireFirm } = require("../middleware/tenant");
const { requirePermission } = require("../middleware/permissions");
const { logActivity } = require("../middleware/activity");

/**
 * Create CRUD routes for a tenant-scoped entity.
 * @param {Object} service - The service with getAll, getById, create, update, delete
 * @param {string} entityName - e.g., "Sale", "Purchase"
 * @param {string} module - Permission module e.g., "Sales", "Purchase"
 * @param {Object} [options]
 * @param {string} [options.dataKey] - Key for the array in getAll result (default: lowercase pluralized)
 */
function createCrudRoutes(service, entityName, module, options = {}) {
  const router = Router({ mergeParams: true });
  const dataKey = options.dataKey || entityName.toLowerCase() + "s";

  router.use(authenticate, requireFirm);

  // GET /
  router.get("/", requirePermission(`${module}.View`), async (req, res, next) => {
    try {
      const { page, pageSize, limit, search, status, category, expenseType, saleType, branchId } = req.query;
      const parsedSize = parseInt(pageSize) || parseInt(limit) || 50;
      const result = await service.getAll(req.activeFirmId, {
        page: parseInt(page) || 1,
        pageSize: Math.min(parsedSize, 500),
        search, status, category, expenseType, saleType, branchId,
      });
      paginated(
        res,
        result[dataKey] || result.items || result,
        result.total,
        result.page,
        result.pageSize
      );
    } catch (err) { next(err); }
  });

  // GET /:id
  router.get("/:id", requirePermission(`${module}.View`), async (req, res, next) => {
    try {
      const item = await service.getById(req.params.id, req.activeFirmId);
      success(res, item);
    } catch (err) { next(err); }
  });

  // POST /
  router.post(
    "/",
    requirePermission(`${module}.Create`),
    logActivity("CREATE", entityName),
    async (req, res, next) => {
      try {
        const item = await service.create(req.body, req.activeFirmId, req.user.id);
        created(res, item, `${entityName} created successfully`);
      } catch (err) { next(err); }
    }
  );

  // PUT /:id
  router.put(
    "/:id",
    requirePermission(`${module}.Edit`),
    logActivity("UPDATE", entityName),
    async (req, res, next) => {
      try {
        const item = await service.update(req.params.id, req.body, req.activeFirmId, req.user.id);
        success(res, item, `${entityName} updated successfully`);
      } catch (err) { next(err); }
    }
  );

  // DELETE /:id
  router.delete(
    "/:id",
    requirePermission(`${module}.Delete`),
    logActivity("DELETE", entityName),
    async (req, res, next) => {
      try {
        await service.delete(req.params.id, req.activeFirmId);
        success(res, null, `${entityName} deleted successfully`);
      } catch (err) { next(err); }
    }
  );

  return router;
}

module.exports = createCrudRoutes;
