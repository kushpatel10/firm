/**
 * Inventory routes — CRUD factory + stock entries + low stock.
 */

const { Router } = require("express");
const createCrudRoutes = require("./crud-factory");
const inventoryService = require("../services/inventory.service");
const { success, created } = require("../utils/response");
const { authenticate } = require("../middleware/auth");
const { requireFirm } = require("../middleware/tenant");
const { requirePermission } = require("../middleware/permissions");
const { logActivity } = require("../middleware/activity");

const crudRouter = createCrudRoutes(inventoryService, "InventoryItem", "Inventory", { dataKey: "items" });

const router = Router({ mergeParams: true });

// GET /low-stock — Items below minimum stock level (must be defined before crudRouter to prevent /:id shadowing)
router.get(
  "/low-stock",
  authenticate, requireFirm, requirePermission("Inventory.View"),
  async (req, res, next) => {
    try {
      const items = await inventoryService.getLowStock(req.activeFirmId);
      success(res, items);
    } catch (err) { next(err); }
  }
);

// POST /:id/stock — Add stock entry (IN or OUT)
router.post(
  "/:id/stock",
  authenticate, requireFirm,
  requirePermission("Inventory.Edit"),
  logActivity("STOCK_UPDATE", "InventoryItem"),
  async (req, res, next) => {
    try {
      const entry = await inventoryService.addStockEntry(
        req.params.id, req.body, req.activeFirmId, req.user.id
      );
      created(res, entry, "Stock entry recorded");
    } catch (err) { next(err); }
  }
);

router.use(crudRouter);

module.exports = router;
