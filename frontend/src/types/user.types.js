/**
 * User type definitions.
 */

/**
 * @typedef {'ACTIVE' | 'INACTIVE' | 'SUSPENDED'} UserStatus
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string|null} name
 * @property {string|null} avatar
 * @property {boolean} isSuperAdmin
 * @property {UserStatus} status
 * @property {string|null} lastLoginAt
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} createdBy
 * @property {string|null} updatedBy
 * @property {UserFirm[]} [firmAssignments]
 */

/**
 * @typedef {Object} UserFirm
 * @property {string} id
 * @property {string} userId
 * @property {string} firmId
 * @property {string} roleId
 * @property {string|null} branchId
 * @property {UserStatus} status
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {import('./firm.types').Firm} [firm]
 * @property {import('./role.types').Role} [role]
 */

/**
 * @typedef {Object} CreateUserInput
 * @property {string} email - Google email address
 * @property {string} [name]
 * @property {string} firmId
 * @property {string} roleId
 * @property {string} [branchId]
 */

/**
 * @typedef {Object} UpdateUserInput
 * @property {string} [name]
 * @property {UserStatus} [status]
 * @property {string} [roleId]
 * @property {string} [branchId]
 */

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
};
