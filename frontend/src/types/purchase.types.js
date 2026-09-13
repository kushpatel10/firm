/**
 * Purchase type definitions.
 */

/**
 * @typedef {Object} Purchase
 * @property {string} id
 * @property {string} firmId
 * @property {string} [branchId]
 * @property {string} [supplierId]
 * @property {string} invoiceNumber
 * @property {string} date
 * @property {PurchaseItem[]} items
 * @property {number} subtotal
 * @property {number} tax
 * @property {number} total
 * @property {string} status
 * @property {string} [invoiceUrl]
 * @property {string} [receiptUrl]
 * @property {string} [notes]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} createdBy
 * @property {string|null} updatedBy
 */

/**
 * @typedef {Object} PurchaseItem
 * @property {string} id
 * @property {string} purchaseId
 * @property {string} name
 * @property {string} [category]
 * @property {number} quantity
 * @property {string} unit
 * @property {number} unitPrice
 * @property {number} total
 */

export const PURCHASE_STATUS = {
  DRAFT: "DRAFT",
  ORDERED: "ORDERED",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED",
};
