/**
 * Report Service
 * Aggregates business data for reports and metrics.
 */

const prisma = require("../config/database");

const reportService = {
  async getSalesReport(firmId, filters = {}) {
    const where = { firmId };
    if (filters.branchId) where.branchId = filters.branchId;

    const sales = await prisma.sale.findMany({
      where,
      include: { items: true, customer: true },
      orderBy: { date: "desc" },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const totalTax = sales.reduce((acc, s) => acc + (s.tax || 0), 0);
    const totalDiscount = sales.reduce((acc, s) => acc + (s.discount || 0), 0);

    const statusCounts = {};
    sales.forEach((s) => {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    });

    const cleanSales = sales.map((sale) => ({
      ...sale,
      customerName: (sale.customerName && sale.customerName.startsWith("enc:rsa:"))
        ? (sale.customer?.name || "Customer")
        : sale.customerName,
      description: (sale.description && sale.description.startsWith("enc:rsa:"))
        ? ""
        : sale.description,
    }));

    return {
      summary: {
        totalSales,
        totalRevenue,
        totalTax,
        totalDiscount,
      },
      statusCounts,
      sales: cleanSales.slice(0, 50),
    };
  },

  async getPurchaseReport(firmId, filters = {}) {
    const where = { firmId };
    if (filters.branchId) where.branchId = filters.branchId;

    const purchases = await prisma.purchase.findMany({
      where,
      include: { items: true, supplier: true },
      orderBy: { date: "desc" },
    });

    const totalPurchases = purchases.length;
    const totalCost = purchases.reduce((acc, p) => acc + (p.total || 0), 0);

    const supplierSpending = {};
    purchases.forEach((p) => {
      const sName = p.supplierName || p.supplier?.name || "Unknown Supplier";
      supplierSpending[sName] = (supplierSpending[sName] || 0) + (p.total || 0);
    });

    return {
      summary: {
        totalPurchases,
        totalCost,
      },
      supplierSpending,
      purchases: purchases.slice(0, 50),
    };
  },

  async getExpenseReport(firmId, filters = {}) {
    const where = { firmId };
    if (filters.branchId) where.branchId = filters.branchId;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    const categoryBreakdown = {};
    expenses.forEach((e) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + (e.amount || 0);
    });

    return {
      summary: {
        totalExpenses,
        totalAmount,
      },
      categoryBreakdown,
      expenses: expenses.slice(0, 50),
    };
  },

  async getInventoryReport(firmId, filters = {}) {
    const where = { firmId };
    if (filters.branchId) where.branchId = filters.branchId;

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: "asc" },
    });

    const totalItems = items.length;
    const totalStockValue = items.reduce((acc, i) => acc + (i.quantity || 0) * (i.sellingPrice || 0), 0);
    const lowStockItems = items.filter((i) => i.quantity <= i.minStock);

    const categoryBreakdown = {};
    items.forEach((i) => {
      const cat = i.category || "Uncategorized";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    return {
      summary: {
        totalItems,
        totalStockValue,
        lowStockCount: lowStockItems.length,
      },
      categoryBreakdown,
      lowStockItems,
      items: items.slice(0, 50),
    };
  },
};

module.exports = reportService;
