const createCrudRoutes = require("./crud-factory");
const supplierService = require("../services/supplier.service");
module.exports = createCrudRoutes(supplierService, "Supplier", "Suppliers", { dataKey: "suppliers" });
