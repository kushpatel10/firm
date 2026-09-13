/**
 * Role and Permission type definitions.
 */

/**
 * @typedef {Object} Role
 * @property {string} id
 * @property {string} name
 * @property {string|null} description
 * @property {string|null} firmId
 * @property {boolean} isSystem
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} createdBy
 * @property {string|null} updatedBy
 * @property {RolePermission[]} [permissions]
 */

/**
 * @typedef {Object} Permission
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {string|null} description
 * @property {string} module
 * @property {string} action
 */

/**
 * @typedef {Object} RolePermission
 * @property {string} id
 * @property {string} roleId
 * @property {string} permissionId
 * @property {Permission} [permission]
 */

/**
 * @typedef {Object} CreateRoleInput
 * @property {string} name
 * @property {string} [description]
 * @property {string} [firmId]
 * @property {string[]} permissionIds
 */

/**
 * @typedef {Object} UpdateRoleInput
 * @property {string} [name]
 * @property {string} [description]
 * @property {string[]} [permissionIds]
 */

/** All permission modules */
export const PERMISSION_MODULES = [
  "Sales",
  "Purchase",
  "Expense",
  "Inventory",
  "Customers",
  "Suppliers",
  "DeliveryChallans",
  "Reports",
  "Settings",
  "Users",
];

/** All permission actions */
export const PERMISSION_ACTIONS = ["View", "Create", "Edit", "Delete", "Manage"];
