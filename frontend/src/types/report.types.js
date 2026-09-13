/**
 * Report type definitions.
 */

/**
 * @typedef {Object} ReportFilter
 * @property {string} firmId
 * @property {string} [branchId]
 * @property {string} startDate
 * @property {string} endDate
 * @property {string} [category]
 * @property {string} [groupBy] - "day" | "week" | "month" | "year"
 */

/**
 * @typedef {Object} ReportResult
 * @property {string} type
 * @property {ReportFilter} filter
 * @property {object} summary
 * @property {Array} data
 * @property {string} generatedAt
 */

export const REPORT_TYPES = {
  SALES: "SALES",
  PURCHASES: "PURCHASES",
  EXPENSES: "EXPENSES",
  INVENTORY: "INVENTORY",
  PROFIT_LOSS: "PROFIT_LOSS",
};

export const GROUP_BY_OPTIONS = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
];
