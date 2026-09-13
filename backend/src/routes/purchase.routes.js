/**
 * Purchase routes — uses CRUD factory.
 */

const createCrudRoutes = require("./crud-factory");
const purchaseService = require("../services/purchase.service");

module.exports = createCrudRoutes(purchaseService, "Purchase", "Purchase", { dataKey: "purchases" });
