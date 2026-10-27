/**
 * Schema Migration Layer & Pre-Restore Dry-Run Validator
 * Handles schema evolution between versions and checks logical integrity
 * without performing any persistent writes to the database.
 */

const { CURRENT_SCHEMA_VERSION } = require("./backup-export.service");

// Sequential migration functions keyed by source version
const MIGRATIONS = {
  // Example for future evolution:
  // 1: (data) => {
  //   (data.sales || []).forEach(s => { s.discount = s.discount || 0; });
  //   return data;
  // },
};

/**
 * Runs migration chain to bring legacy snapshot up to CURRENT_SCHEMA_VERSION.
 * @param {Object} snapshot
 * @returns {Object} Migrated snapshot
 */
function migrateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("Invalid snapshot payload: expected object");
  }

  let version = snapshot.schemaVersion || 1;
  let data = snapshot.data || {};

  while (version < CURRENT_SCHEMA_VERSION) {
    if (MIGRATIONS[version]) {
      data = MIGRATIONS[version](data);
    }
    version++;
  }

  snapshot.schemaVersion = CURRENT_SCHEMA_VERSION;
  snapshot.data = data;
  return snapshot;
}

/**
 * Validates logical integrity and foreign-key consistency of snapshot data.
 * Does not make any database mutations.
 *
 * @param {Object} snapshot
 * @returns {Object} { isValid, errors, warnings, firmName, createdAt, manifest, schemaVersion }
 */
function validateSnapshotIntegrity(snapshot) {
  const errors = [];
  const warnings = [];

  if (!snapshot) {
    return {
      isValid: false,
      errors: ["Snapshot is completely empty or null"],
      warnings: [],
    };
  }

  const { data, manifest, schemaVersion, firmName, createdAt } = snapshot;

  if (!data) {
    errors.push("Missing snapshot data payload");
    return { isValid: false, errors, warnings };
  }

  // 1. Verify firm identity
  if (!data.firm || typeof data.firm !== "object") {
    errors.push("Missing core firm details in data payload");
  } else if (!data.firm.name) {
    errors.push("Firm name is empty in backup snapshot");
  }

  // 2. Validate branch references
  const branchIds = new Set((data.branches || []).map((b) => b.id).filter(Boolean));

  // 3. Validate customer references
  const customerIds = new Set((data.customers || []).map((c) => c.id).filter(Boolean));
  (data.sales || []).forEach((sale, i) => {
    const saleId = sale.invoiceNumber || sale.id || `#${i + 1}`;
    if (sale.customerId && !customerIds.has(sale.customerId)) {
      warnings.push(`Sale ${saleId} references unlisted customer (${sale.customerId})`);
    }
    if (sale.branchId && !branchIds.has(sale.branchId)) {
      warnings.push(`Sale ${saleId} references unlisted branch (${sale.branchId})`);
    }
  });

  // 4. Validate supplier references
  const supplierIds = new Set((data.suppliers || []).map((s) => s.id).filter(Boolean));
  (data.purchases || []).forEach((purchase, i) => {
    const purchaseId = purchase.invoiceNumber || purchase.id || `#${i + 1}`;
    if (purchase.supplierId && !supplierIds.has(purchase.supplierId)) {
      warnings.push(`Purchase ${purchaseId} references unlisted supplier (${purchase.supplierId})`);
    }
    if (purchase.branchId && !branchIds.has(purchase.branchId)) {
      warnings.push(`Purchase ${purchaseId} references unlisted branch (${purchase.branchId})`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    firmName: firmName || data.firm?.name || "Unknown Firm",
    createdAt: createdAt || new Date().toISOString(),
    manifest: manifest || {
      branches: data.branches?.length || 0,
      categories: data.categories?.length || 0,
      customers: data.customers?.length || 0,
      suppliers: data.suppliers?.length || 0,
      inventoryItems: data.inventoryItems?.length || 0,
      sales: data.sales?.length || 0,
      saleItems: (data.sales || []).reduce((acc, s) => acc + (s.items?.length || 0), 0),
      purchases: data.purchases?.length || 0,
      purchaseItems: (data.purchases || []).reduce((acc, p) => acc + (p.items?.length || 0), 0),
      expenses: data.expenses?.length || 0,
      deliveryChallans: data.deliveryChallans?.length || 0,
    },
    schemaVersion: schemaVersion || 1,
    isCompatible: (schemaVersion || 1) <= CURRENT_SCHEMA_VERSION,
  };
}

module.exports = {
  migrateSnapshot,
  validateSnapshotIntegrity,
  CURRENT_SCHEMA_VERSION,
};
