/**
 * Snapshot Export Engine
 * Captures an entire firm's state in a single, consistent REPEATABLE READ snapshot.
 */

const prisma = require("../config/database");
const { Prisma } = require("@prisma/client");
const crypto = require("crypto");

const CURRENT_SCHEMA_VERSION = 1;

/**
 * Exports all firm operational and configuration data in an atomic snapshot.
 * Guarantees zero partial/inconsistent reads by maintaining a single REPEATABLE READ transaction.
 *
 * @param {string} firmId
 * @returns {Promise<Object>} Unencrypted snapshot object with manifest and entity tables
 */
async function exportFirmSnapshot(firmId) {
  if (!firmId) {
    throw new Error("Firm ID is required for backup export");
  }

  return await prisma.$transaction(
    async (tx) => {
      // 1. Fetch Firm profile
      const firm = await tx.firm.findUnique({
        where: { id: firmId },
        select: {
          id: true,
          name: true,
          businessType: true,
          currency: true,
          timezone: true,
          gstNumber: true,
          address: true,
          phone: true,
          status: true,
          masterBusinessKey: true,
        },
      });

      if (!firm) {
        throw new Error(`Firm not found with ID: ${firmId}`);
      }

      // 2. Fetch all dependent operational and configuration entities through tx
      const branches = await tx.branch.findMany({
        where: { firmId },
        orderBy: { createdAt: "asc" },
      });

      const categories = await tx.category.findMany({
        where: { firmId },
        include: {
          subtypes: true,
          dimensions: true,
          sizePresets: true,
          pricingRules: true,
        },
        orderBy: { sortOrder: "asc" },
      });

      const customers = await tx.customer.findMany({
        where: { firmId },
        orderBy: { name: "asc" },
      });

      const suppliers = await tx.supplier.findMany({
        where: { firmId },
        orderBy: { name: "asc" },
      });

      const inventoryItems = await tx.inventoryItem.findMany({
        where: { firmId },
        orderBy: { name: "asc" },
      });

      const sales = await tx.sale.findMany({
        where: { firmId },
        include: { items: true },
        orderBy: { date: "desc" },
      });

      const purchases = await tx.purchase.findMany({
        where: { firmId },
        include: { items: true },
        orderBy: { date: "desc" },
      });

      const expenses = await tx.expense.findMany({
        where: { firmId },
        orderBy: { date: "desc" },
      });

      const deliveryChallans = await tx.deliveryChallan.findMany({
        where: { firmId },
        orderBy: { date: "desc" },
      });

      const totalSaleItems = sales.reduce((acc, s) => acc + (s.items?.length || 0), 0);
      const totalPurchaseItems = purchases.reduce((acc, p) => acc + (p.items?.length || 0), 0);
      const totalCategorySubtypes = categories.reduce((acc, c) => acc + (c.subtypes?.length || 0), 0);

      const backupId = crypto.randomUUID();

      return {
        backupId,
        firmId: firm.id,
        firmName: firm.name,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        createdAt: new Date().toISOString(),
        generator: "Firm-BackupEngine-v2.0",
        manifest: {
          branches: branches.length,
          categories: categories.length,
          categorySubtypes: totalCategorySubtypes,
          customers: customers.length,
          suppliers: suppliers.length,
          inventoryItems: inventoryItems.length,
          sales: sales.length,
          saleItems: totalSaleItems,
          purchases: purchases.length,
          purchaseItems: totalPurchaseItems,
          expenses: expenses.length,
          deliveryChallans: deliveryChallans.length,
        },
        data: {
          firm,
          branches,
          categories,
          customers,
          suppliers,
          inventoryItems,
          sales,
          purchases,
          expenses,
          deliveryChallans,
        },
      };
    },
    {
      isolationLevel: "RepeatableRead",
      timeout: 30000,
    }
  );
}

module.exports = {
  exportFirmSnapshot,
  CURRENT_SCHEMA_VERSION,
};
