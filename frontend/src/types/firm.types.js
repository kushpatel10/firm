/**
 * Firm and Branch type definitions.
 */

/**
 * @typedef {'ACTIVE' | 'ARCHIVED' | 'SUSPENDED'} FirmStatus
 */

/**
 * @typedef {'ACTIVE' | 'INACTIVE' | 'CLOSED'} BranchStatus
 */

/**
 * @typedef {Object} Firm
 * @property {string} id
 * @property {string} name
 * @property {string|null} logo
 * @property {string} businessType
 * @property {string|null} gstNumber
 * @property {string|null} address
 * @property {string|null} phone
 * @property {string} currency
 * @property {string} timezone
 * @property {FirmStatus} status
 * @property {string|null} masterBusinessKey
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} createdBy
 * @property {string|null} updatedBy
 * @property {Branch[]} [branches]
 */

/**
 * @typedef {Object} Branch
 * @property {string} id
 * @property {string} name
 * @property {string|null} code
 * @property {string|null} address
 * @property {string|null} phone
 * @property {string} firmId
 * @property {BranchStatus} status
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} createdBy
 * @property {string|null} updatedBy
 */

/**
 * @typedef {Object} CreateFirmInput
 * @property {string} name
 * @property {string} businessType
 * @property {string} [logo]
 * @property {string} [gstNumber]
 * @property {string} [address]
 * @property {string} [phone]
 * @property {string} [currency]
 * @property {string} [timezone]
 * @property {string} [masterBusinessKey]
 */

/**
 * @typedef {Object} UpdateFirmInput
 * @property {string} [name]
 * @property {string} [businessType]
 * @property {string} [logo]
 * @property {string} [gstNumber]
 * @property {string} [address]
 * @property {string} [phone]
 * @property {string} [currency]
 * @property {string} [timezone]
 * @property {FirmStatus} [status]
 * @property {string} [masterBusinessKey]
 */

/**
 * @typedef {Object} CreateBranchInput
 * @property {string} name
 * @property {string} firmId
 * @property {string} [code]
 * @property {string} [address]
 * @property {string} [phone]
 */

export const FIRM_STATUS = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  SUSPENDED: "SUSPENDED",
};

export const BRANCH_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  CLOSED: "CLOSED",
};

export const BUSINESS_TYPES = [
  "Retail",
  "Wholesale",
  "Manufacturing",
  "Services",
  "Import/Export",
  "E-Commerce",
  "Real Estate",
  "Healthcare",
  "Education",
  "Technology",
  "Other",
];

export const CURRENCIES = [
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
];

export const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
];
