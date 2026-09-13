/**
 * Sales routes — uses CRUD factory.
 */

const createCrudRoutes = require("./crud-factory");
const salesService = require("../services/sales.service");

module.exports = createCrudRoutes(salesService, "Sale", "Sales", { dataKey: "sales" });
