/**
 * Sales type definitions.
 */

/**
 * @typedef {Object} Sale
 * @property {string} id
 * @property {string} firmId
 * @property {string} [branchId]
 * @property {string} [customerId]
 * @property {string} invoiceNumber
 * @property {string} date
 * @property {SaleItem[]} items
 * @property {number} subtotal
 * @property {number} tax
 * @property {number} discount
 * @property {number} total
 * @property {string} status
 * @property {string} [notes]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} createdBy
 * @property {string|null} updatedBy
 */

/**
 * @typedef {Object} SaleItem
 * @property {string} id
 * @property {string} saleId
 * @property {string} name
 * @property {string} [category]
 * @property {number} quantity
 * @property {string} unit
 * @property {number} unitPrice
 * @property {number} total
 */

/**
 * @typedef {Object} SaleCategory
 * @property {string} id
 * @property {string} name
 * @property {string} firmId
 */

export const SALE_STATUS = {
  DRAFT: "DRAFT",
  CONFIRMED: "CONFIRMED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};
