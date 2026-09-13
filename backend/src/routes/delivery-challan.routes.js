const createCrudRoutes = require("./crud-factory");
const deliveryChallanService = require("../services/delivery-challan.service");
module.exports = createCrudRoutes(deliveryChallanService, "DeliveryChallan", "DeliveryChallans", { dataKey: "challans" });
