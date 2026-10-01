/**
 * Inventory type definitions.
 */

/**
 * @typedef {Object} InventoryItem
 * @property {string} id
 * @property {string} firmId
 * @property {string} [branchId]
 * @property {string} name
 * @property {string} [sku]
 * @property {string} [category]
 * @property {string} unit
 * @property {number} quantity
 * @property {number} minStock
 * @property {number} sellingPrice
 * @property {number} purchasePrice
 * @property {any} [sizes]
 * @property {string} [description]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} createdBy
 * @property {string|null} updatedBy
 */

/**
 * @typedef {Object} StockEntry
 * @property {string} id
 * @property {string} itemId
 * @property {string} type - "IN" or "OUT"
 * @property {number} quantity
 * @property {string} [reference]
 * @property {string} [notes]
 * @property {string} createdAt
 * @property {string|null} createdBy
 */

/**
 * @typedef {Object} InventoryCategory
 * @property {string} id
 * @property {string} name
 * @property {string} firmId
 */

/**
 * @typedef {Object} InventoryUnit
 * @property {string} id
 * @property {string} name
 * @property {string} abbreviation
 */

export const STOCK_ENTRY_TYPES = {
  IN: "IN",
  OUT: "OUT",
};

export const DEFAULT_UNITS = [
  { name: "Piece", abbreviation: "pcs" },
  { name: "Kilogram", abbreviation: "kg" },
  { name: "Gram", abbreviation: "g" },
  { name: "Litre", abbreviation: "L" },
  { name: "Millilitre", abbreviation: "mL" },
  { name: "Metre", abbreviation: "m" },
  { name: "Box", abbreviation: "box" },
  { name: "Pack", abbreviation: "pack" },
  { name: "Dozen", abbreviation: "doz" },
];
