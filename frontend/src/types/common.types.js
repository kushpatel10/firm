/**
 * Common type definitions used across the application.
 * Using JSDoc for type safety in JavaScript.
 */

/**
 * @typedef {Object} AuditFields
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} createdBy
 * @property {string|null} updatedBy
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {Array} data
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {*} data
 * @property {string} [message]
 * @property {Array} [errors]
 */

/**
 * @typedef {'asc' | 'desc'} SortOrder
 */

/**
 * @typedef {Object} SortConfig
 * @property {string} field
 * @property {SortOrder} order
 */

/**
 * @typedef {Object} FilterConfig
 * @property {string} field
 * @property {string} operator
 * @property {*} value
 */

export const SORT_ORDERS = {
  ASC: "asc",
  DESC: "desc",
};
