/**
 * Expense routes — CRUD factory + monthly summary.
 */

const { Router } = require("express");
const createCrudRoutes = require("./crud-factory");
const expenseService = require("../services/expense.service");
const { success } = require("../utils/response");
const { authenticate } = require("../middleware/auth");
const { requireFirm } = require("../middleware/tenant");
const { requirePermission } = require("../middleware/permissions");

const crudRouter = createCrudRoutes(expenseService, "Expense", "Expense", { dataKey: "expenses" });

const router = Router({ mergeParams: true });

router.use(crudRouter);

// GET /summary — Monthly expense summary
router.get(
  "/summary",
  authenticate, requireFirm, requirePermission("Expense.View"),
  async (req, res, next) => {
    try {
      const { year, month } = req.query;
      const y = parseInt(year) || new Date().getFullYear();
      const m = parseInt(month) || new Date().getMonth() + 1;
      const summary = await expenseService.getMonthlySummary(req.activeFirmId, y, m);
      success(res, summary);
    } catch (err) { next(err); }
  }
);

module.exports = router;
