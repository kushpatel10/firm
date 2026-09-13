const createCrudRoutes = require("./crud-factory");
const customerService = require("../services/customer.service");
module.exports = createCrudRoutes(customerService, "Customer", "Customers", { dataKey: "customers" });
