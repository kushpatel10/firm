/**
 * Expense type definitions.
 */

/**
 * @typedef {Object} Expense
 * @property {string} id
 * @property {string} firmId
 * @property {string} [branchId]
 * @property {string} category
 * @property {string} description
 * @property {number} amount
 * @property {string} date
 * @property {string} [receiptUrl]
 * @property {string} [notes]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} createdBy
 * @property {string|null} updatedBy
 */

/**
 * @typedef {Object} ExpenseCategory
 * @property {string} id
 * @property {string} name
 * @property {string} firmId
 */

/**
 * @typedef {Object} ExpenseMonthlySummary
 * @property {string} month
 * @property {number} total
 * @property {{ category: string, amount: number }[]} byCategory
 */

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Office Supplies",
  "Travel",
  "Marketing",
  "Insurance",
  "Maintenance",
  "Miscellaneous",
];
