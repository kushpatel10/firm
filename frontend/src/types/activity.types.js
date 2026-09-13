/**
 * Activity log type definitions.
 */

/**
 * @typedef {Object} ActivityLog
 * @property {string} id
 * @property {string} action
 * @property {object|null} details
 * @property {string|null} entityType
 * @property {string|null} entityId
 * @property {string|null} userId
 * @property {string|null} firmId
 * @property {string|null} ipAddress
 * @property {string|null} userAgent
 * @property {string} createdAt
 * @property {import('./user.types').User} [user]
 * @property {import('./firm.types').Firm} [firm]
 */

/**
 * @typedef {Object} ActivityFilter
 * @property {string} [action]
 * @property {string} [userId]
 * @property {string} [firmId]
 * @property {string} [entityType]
 * @property {string} [startDate]
 * @property {string} [endDate]
 * @property {number} [page]
 * @property {number} [pageSize]
 */

export const ACTIVITY_ACTIONS = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DEACTIVATED: "USER_DEACTIVATED",
  FIRM_CREATED: "FIRM_CREATED",
  FIRM_UPDATED: "FIRM_UPDATED",
  FIRM_ARCHIVED: "FIRM_ARCHIVED",
  FIRM_DELETED: "FIRM_DELETED",
  ROLE_CREATED: "ROLE_CREATED",
  ROLE_UPDATED: "ROLE_UPDATED",
  PERMISSION_CHANGED: "PERMISSION_CHANGED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  BRANCH_CREATED: "BRANCH_CREATED",
  BRANCH_UPDATED: "BRANCH_UPDATED",
};
