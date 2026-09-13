/**
 * Dashboard Service
 * Provides summary KPI statistics and recent activity for Firm and Admin dashboards.
 */

const prisma = require("../config/database");

const dashboardService = {
  async getFirmSummary(firmId) {
    const [sales, purchases, expenses, inventoryCount, recentActivity] = await Promise.all([
      prisma.sale.aggregate({
        where: { firmId },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.purchase.aggregate({
        where: { firmId },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.expense.aggregate({
        where: { firmId },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.inventoryItem.count({
        where: { firmId },
      }),
      prisma.activityLog.findMany({
        where: { firmId },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    const recentSales = await prisma.sale.findMany({
      where: { firmId },
      take: 6,
      orderBy: { date: "desc" },
      select: { id: true, total: true, date: true, status: true, customerName: true },
    });

    const keyVaultService = require("./key-vault.service");
    const asymmetricCrypto = require("../utils/asymmetric-crypto");
    const privateKey = keyVaultService.getPrivateKey(firmId);

    const decryptedRecentSales = recentSales.map((sale) => ({
      ...sale,
      customerName: asymmetricCrypto.decryptWithPrivateKey(sale.customerName, privateKey),
    }));

    return {
      stats: {
        totalSales: sales._sum.total || 0,
        salesCount: sales._count.id || 0,
        totalPurchases: purchases._sum.total || 0,
        purchasesCount: purchases._count.id || 0,
        totalExpenses: expenses._sum.amount || 0,
        expensesCount: expenses._count.id || 0,
        totalInventory: inventoryCount || 0,
      },
      recentSales: decryptedRecentSales,
      recentActivity,
    };
  },

  async getAdminSummary() {
    const [firmsCount, activeUsersCount, totalActivityCount, recentActivity] = await Promise.all([
      prisma.firm.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.activityLog.count(),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          firm: { select: { name: true } },
        },
      }),
    ]);

    return {
      stats: {
        totalFirms: firmsCount,
        activeUsers: activeUsersCount,
        totalActivity: totalActivityCount,
        storageUsage: "0.5 GB",
      },
      recentActivity,
    };
  },
};

module.exports = dashboardService;
