/**
 * Two-Phase Transactional Restore Engine
 * Executes atomic firm restoration supporting both "NEW_FIRM" (isolated clone with remapped IDs)
 * and "OVERWRITE" (clean slate transactional rollback) modes.
 */

const prisma = require("../config/database");
const crypto = require("crypto");
const { migrateSnapshot, validateSnapshotIntegrity } = require("./backup-validator.service");

/**
 * Restores firm data inside a single atomic database transaction.
 *
 * @param {Object} snapshot - Unencrypted snapshot payload
 * @param {string} mode - "NEW_FIRM" | "OVERWRITE"
 * @param {string} currentUserId - ID of authenticated user executing restore
 * @param {string|null} targetFirmId - Required if mode is "OVERWRITE"
 * @returns {Promise<Object>} Restoration outcome
 */
async function restoreFirmData(snapshot, mode, currentUserId, targetFirmId = null) {
  if (!snapshot) {
    throw new Error("No backup snapshot provided for restoration");
  }

  // 1. Run schema migrations
  const migrated = migrateSnapshot(snapshot);

  // 2. Validate snapshot integrity
  const validation = validateSnapshotIntegrity(migrated);
  if (!validation.isValid) {
    throw new Error(`Restore failed integrity check: ${validation.errors.join("; ")}`);
  }

  const { data } = migrated;

  return await prisma.$transaction(
    async (tx) => {
      let result;
      if (mode === "NEW_FIRM") {
        result = await restoreAsNewFirm(tx, data, currentUserId, migrated.manifest);
      } else if (mode === "OVERWRITE") {
        if (!targetFirmId) {
          throw new Error("Target firm ID is required for OVERWRITE mode");
        }
        result = await restoreOverwrite(tx, data, targetFirmId, currentUserId, migrated.manifest);
      } else {
        throw new Error(`Unsupported restore mode: ${mode}`);
      }

      return result;
    },
    { timeout: 60000 }
  );
}

/**
 * Creates a brand new firm, re-generates all IDs, and maps all foreign keys.
 */
async function restoreAsNewFirm(tx, data, userId, manifest) {
  const firmData = data.firm || {};

  // 1. Create Firm
  const newFirm = await tx.firm.create({
    data: {
      name: `${firmData.name || "Restored Firm"} (Restored)`,
      businessType: firmData.businessType || "Retail",
      currency: firmData.currency || "INR",
      timezone: firmData.timezone || "Asia/Kolkata",
      gstNumber: firmData.gstNumber,
      address: firmData.address,
      phone: firmData.phone,
      masterBusinessKey: firmData.masterBusinessKey,
    },
  });

  // ID Maps
  const branchMap = new Map();
  const categoryMap = new Map();
  const customerMap = new Map();
  const supplierMap = new Map();

  // 2. Re-create Branches
  for (const b of data.branches || []) {
    const created = await tx.branch.create({
      data: {
        firmId: newFirm.id,
        name: b.name,
        code: b.code ? `${b.code}-R` : null, // Prevent potential unique constraint collision
        address: b.address,
        phone: b.phone,
        status: b.status || "ACTIVE",
      },
    });
    branchMap.set(b.id, created.id);
  }

  // 3. Re-create Categories & Presets
  for (const c of data.categories || []) {
    const created = await tx.category.create({
      data: {
        firmId: newFirm.id,
        name: c.name,
        icon: c.icon,
        description: c.description,
        hasSubtypes: c.hasSubtypes ?? true,
        formula: c.formula,
        calculationLabel: c.calculationLabel,
        rateLabel: c.rateLabel,
        unit: c.unit,
        sortOrder: c.sortOrder || 0,
        isActive: c.isActive ?? true,
      },
    });
    categoryMap.set(c.id, created.id);

    // Subtypes
    for (const sub of c.subtypes || []) {
      await tx.categorySubtype.create({
        data: {
          categoryId: created.id,
          name: sub.name,
          description: sub.description,
          defaultRate: sub.defaultRate,
          sortOrder: sub.sortOrder || 0,
          isActive: sub.isActive ?? true,
        },
      });
    }

    // Dimensions
    for (const dim of c.dimensions || []) {
      await tx.dimensionDefinition.create({
        data: {
          categoryId: created.id,
          key: dim.key,
          label: dim.label,
          unit: dim.unit,
          type: dim.type || "NUMBER",
          required: dim.required ?? true,
          defaultValue: dim.defaultValue,
          placeholder: dim.placeholder,
          sortOrder: dim.sortOrder || 0,
        },
      });
    }

    // Size Presets
    for (const sp of c.sizePresets || []) {
      await tx.sizePreset.create({
        data: {
          categoryId: created.id,
          name: sp.name,
          standardRate: sp.standardRate,
          isCustom: sp.isCustom ?? false,
          sortOrder: sp.sortOrder || 0,
        },
      });
    }

    // Pricing Rules
    for (const pr of c.pricingRules || []) {
      await tx.pricingRule.create({
        data: {
          categoryId: created.id,
          name: pr.name,
          formula: pr.formula,
          formulaExplanation: pr.formulaExplanation,
          rounding: pr.rounding || "ROUND_HALF_UP",
          decimalPlaces: pr.decimalPlaces || 2,
          isActive: pr.isActive ?? true,
        },
      });
    }
  }

  // 4. Re-create Customers & Suppliers
  for (const cust of data.customers || []) {
    const created = await tx.customer.create({
      data: {
        firmId: newFirm.id,
        name: cust.name,
        email: cust.email,
        phone: cust.phone,
        address: cust.address,
      },
    });
    customerMap.set(cust.id, created.id);
  }

  for (const sup of data.suppliers || []) {
    const created = await tx.supplier.create({
      data: {
        firmId: newFirm.id,
        name: sup.name,
        email: sup.email,
        phone: sup.phone,
        address: sup.address,
      },
    });
    supplierMap.set(sup.id, created.id);
  }

  // 5. Re-create Inventory Items
  for (const item of data.inventoryItems || []) {
    await tx.inventoryItem.create({
      data: {
        firmId: newFirm.id,
        branchId: item.branchId ? branchMap.get(item.branchId) || null : null,
        name: item.name,
        sku: item.sku,
        category: item.category,
        unit: item.unit || "PCS",
        sellingPrice: item.sellingPrice || 0,
        purchasePrice: item.purchasePrice || 0,
        quantity: item.quantity || 0,
        minStock: item.minStock || 5,
        sizes: item.sizes,
      },
    });
  }

  // 6. Re-create Sales & Line Items
  for (const s of data.sales || []) {
    const sale = await tx.sale.create({
      data: {
        firmId: newFirm.id,
        branchId: s.branchId ? branchMap.get(s.branchId) || null : null,
        customerId: s.customerId ? customerMap.get(s.customerId) || null : null,
        customerName: s.customerName,
        invoiceNumber: s.invoiceNumber,
        date: s.date ? new Date(s.date) : new Date(),
        subtotal: s.subtotal || 0,
        tax: s.tax || 0,
        discount: s.discount || 0,
        total: s.total || 0,
        status: s.status || "CONFIRMED",
        saleType: s.saleType || "PAKU",
        description: s.description,
      },
    });

    if (s.items && s.items.length > 0) {
      await tx.saleItem.createMany({
        data: s.items.map((it) => ({
          saleId: sale.id,
          name: it.name,
          category: it.category,
          size: it.size,
          quantity: it.quantity || 1,
          unit: it.unit || "pcs",
          unitPrice: it.unitPrice || 0,
          total: it.total || 0,
          dimensions: it.dimensions,
          formula: it.formula,
          calculatedArea: it.calculatedArea,
          rate: it.rate,
          subtype: it.subtype,
          snapshot: it.snapshot,
        })),
      });
    }
  }

  // 7. Re-create Purchases & Line Items
  for (const p of data.purchases || []) {
    const purchase = await tx.purchase.create({
      data: {
        firmId: newFirm.id,
        branchId: p.branchId ? branchMap.get(p.branchId) || null : null,
        supplierId: p.supplierId ? supplierMap.get(p.supplierId) || null : null,
        supplierName: p.supplierName,
        invoiceNumber: p.invoiceNumber,
        date: p.date ? new Date(p.date) : new Date(),
        subtotal: p.subtotal || 0,
        tax: p.tax || 0,
        total: p.total || 0,
        status: p.status || "RECEIVED",
      },
    });

    if (p.items && p.items.length > 0) {
      await tx.purchaseItem.createMany({
        data: p.items.map((it) => ({
          purchaseId: purchase.id,
          name: it.name,
          category: it.category,
          size: it.size,
          quantity: it.quantity || 1,
          unit: it.unit || "pcs",
          unitPrice: it.unitPrice || 0,
          total: it.total || 0,
        })),
      });
    }
  }

  // 8. Re-create Expenses
  for (const exp of data.expenses || []) {
    await tx.expense.create({
      data: {
        firmId: newFirm.id,
        branchId: exp.branchId ? branchMap.get(exp.branchId) || null : null,
        category: exp.category || "General",
        expenseType: exp.expenseType || "PAKU",
        description: exp.description,
        amount: exp.amount || 0,
        date: exp.date ? new Date(exp.date) : new Date(),
      },
    });
  }

  // 9. Re-create Delivery Challans
  for (const dc of data.deliveryChallans || []) {
    await tx.deliveryChallan.create({
      data: {
        firmId: newFirm.id,
        branchId: dc.branchId ? branchMap.get(dc.branchId) || null : null,
        customerId: dc.customerId ? customerMap.get(dc.customerId) || null : null,
        customerName: dc.customerName,
        challanNumber: dc.challanNumber,
        status: dc.status || "DELIVERED",
        date: dc.date ? new Date(dc.date) : new Date(),
      },
    });
  }

  // 10. Assign current user as Owner
  if (userId) {
    const ownerRole = await tx.role.findFirst({
      where: { name: "Owner", isSystem: true },
    });

    if (ownerRole) {
      await tx.userFirm.create({
        data: {
          userId,
          firmId: newFirm.id,
          roleId: ownerRole.id,
          status: "ACTIVE",
        },
      });
    }
  }

  // 11. Record in BackupHistory
  await tx.backupHistory.create({
    data: {
      backupId: crypto.randomUUID(),
      firmId: newFirm.id,
      actionType: "RESTORE_NEW_FIRM",
      status: "SUCCESS",
      manifest: manifest || null,
    },
  });

  return {
    success: true,
    newFirmId: newFirm.id,
    firmName: newFirm.name,
    mode: "NEW_FIRM",
  };
}

/**
 * Destructively rolls back and overwrites an existing firm's operational data with snapshot records.
 */
async function restoreOverwrite(tx, data, targetFirmId, userId, manifest) {
  const existingFirm = await tx.firm.findUnique({ where: { id: targetFirmId } });
  if (!existingFirm) {
    throw new Error(`Target firm not found with ID: ${targetFirmId}`);
  }

  // 1. Delete dependent operational records in reverse FK order
  await tx.saleItem.deleteMany({ where: { sale: { firmId: targetFirmId } } });
  await tx.sale.deleteMany({ where: { firmId: targetFirmId } });
  await tx.purchaseItem.deleteMany({ where: { purchase: { firmId: targetFirmId } } });
  await tx.purchase.deleteMany({ where: { firmId: targetFirmId } });
  await tx.inventoryItem.deleteMany({ where: { firmId: targetFirmId } });
  await tx.expense.deleteMany({ where: { firmId: targetFirmId } });
  await tx.deliveryChallan.deleteMany({ where: { firmId: targetFirmId } });

  // 2. Map existing branches, customers, suppliers
  const existingBranches = await tx.branch.findMany({ where: { firmId: targetFirmId } });
  const branchMap = new Map();
  for (const b of data.branches || []) {
    let match = existingBranches.find((eb) => eb.code === b.code || eb.name === b.name);
    if (!match) {
      match = await tx.branch.create({
        data: {
          firmId: targetFirmId,
          name: b.name,
          code: b.code,
          address: b.address,
          phone: b.phone,
        },
      });
    }
    branchMap.set(b.id, match.id);
  }

  const existingCustomers = await tx.customer.findMany({ where: { firmId: targetFirmId } });
  const customerMap = new Map();
  for (const c of data.customers || []) {
    let match = existingCustomers.find((ec) => ec.name === c.name || (c.phone && ec.phone === c.phone));
    if (!match) {
      match = await tx.customer.create({
        data: {
          firmId: targetFirmId,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
        },
      });
    }
    customerMap.set(c.id, match.id);
  }

  const existingSuppliers = await tx.supplier.findMany({ where: { firmId: targetFirmId } });
  const supplierMap = new Map();
  for (const s of data.suppliers || []) {
    let match = existingSuppliers.find((es) => es.name === s.name || (s.phone && es.phone === s.phone));
    if (!match) {
      match = await tx.supplier.create({
        data: {
          firmId: targetFirmId,
          name: s.name,
          phone: s.phone,
          email: s.email,
          address: s.address,
        },
      });
    }
    supplierMap.set(s.id, match.id);
  }

  // 3. Re-insert inventory items
  for (const item of data.inventoryItems || []) {
    await tx.inventoryItem.create({
      data: {
        firmId: targetFirmId,
        branchId: item.branchId ? branchMap.get(item.branchId) || null : null,
        name: item.name,
        sku: item.sku,
        category: item.category,
        unit: item.unit || "PCS",
        sellingPrice: item.sellingPrice || 0,
        purchasePrice: item.purchasePrice || 0,
        quantity: item.quantity || 0,
        minStock: item.minStock || 5,
        sizes: item.sizes,
      },
    });
  }

  // 4. Re-insert sales
  for (const s of data.sales || []) {
    const sale = await tx.sale.create({
      data: {
        firmId: targetFirmId,
        branchId: s.branchId ? branchMap.get(s.branchId) || null : null,
        customerId: s.customerId ? customerMap.get(s.customerId) || null : null,
        customerName: s.customerName,
        invoiceNumber: s.invoiceNumber,
        date: s.date ? new Date(s.date) : new Date(),
        subtotal: s.subtotal || 0,
        tax: s.tax || 0,
        discount: s.discount || 0,
        total: s.total || 0,
        status: s.status || "CONFIRMED",
        saleType: s.saleType || "PAKU",
        description: s.description,
      },
    });

    if (s.items && s.items.length > 0) {
      await tx.saleItem.createMany({
        data: s.items.map((it) => ({
          saleId: sale.id,
          name: it.name,
          category: it.category,
          size: it.size,
          quantity: it.quantity || 1,
          unit: it.unit || "pcs",
          unitPrice: it.unitPrice || 0,
          total: it.total || 0,
          dimensions: it.dimensions,
          formula: it.formula,
          calculatedArea: it.calculatedArea,
          rate: it.rate,
          subtype: it.subtype,
          snapshot: it.snapshot,
        })),
      });
    }
  }

  // 5. Re-insert purchases
  for (const p of data.purchases || []) {
    const purchase = await tx.purchase.create({
      data: {
        firmId: targetFirmId,
        branchId: p.branchId ? branchMap.get(p.branchId) || null : null,
        supplierId: p.supplierId ? supplierMap.get(p.supplierId) || null : null,
        supplierName: p.supplierName,
        invoiceNumber: p.invoiceNumber,
        date: p.date ? new Date(p.date) : new Date(),
        subtotal: p.subtotal || 0,
        tax: p.tax || 0,
        total: p.total || 0,
        status: p.status || "RECEIVED",
      },
    });

    if (p.items && p.items.length > 0) {
      await tx.purchaseItem.createMany({
        data: p.items.map((it) => ({
          purchaseId: purchase.id,
          name: it.name,
          category: it.category,
          size: it.size,
          quantity: it.quantity || 1,
          unit: it.unit || "pcs",
          unitPrice: it.unitPrice || 0,
          total: it.total || 0,
        })),
      });
    }
  }

  // 6. Re-insert expenses & challans
  for (const exp of data.expenses || []) {
    await tx.expense.create({
      data: {
        firmId: targetFirmId,
        branchId: exp.branchId ? branchMap.get(exp.branchId) || null : null,
        category: exp.category || "General",
        expenseType: exp.expenseType || "PAKU",
        description: exp.description,
        amount: exp.amount || 0,
        date: exp.date ? new Date(exp.date) : new Date(),
      },
    });
  }

  for (const dc of data.deliveryChallans || []) {
    await tx.deliveryChallan.create({
      data: {
        firmId: targetFirmId,
        branchId: dc.branchId ? branchMap.get(dc.branchId) || null : null,
        customerId: dc.customerId ? customerMap.get(dc.customerId) || null : null,
        customerName: dc.customerName,
        challanNumber: dc.challanNumber,
        status: dc.status || "DELIVERED",
        date: dc.date ? new Date(dc.date) : new Date(),
      },
    });
  }

  // 7. Record in BackupHistory
  await tx.backupHistory.create({
    data: {
      backupId: crypto.randomUUID(),
      firmId: targetFirmId,
      actionType: "RESTORE_OVERWRITE",
      status: "SUCCESS",
      manifest: manifest || null,
    },
  });

  return {
    success: true,
    firmId: targetFirmId,
    firmName: existingFirm.name,
    mode: "OVERWRITE",
  };
}

module.exports = {
  restoreFirmData,
};
