/**
 * Authentication type definitions.
 */

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} email
 * @property {string|null} name
 * @property {string|null} avatar
 * @property {boolean} isSuperAdmin
 * @property {string} status
 */

/**
 * @typedef {Object} AuthSession
 * @property {AuthUser} user
 * @property {import('./firm.types').Firm|null} firm
 * @property {import('./role.types').Role|null} role
 * @property {string[]} permissions - Array of permission codes
 * @property {string} token
 */

/**
 * @typedef {Object} LoginResponse
 * @property {boolean} success
 * @property {AuthSession} [session]
 * @property {string} [message]
 */

export const AUTH_STATUS = {
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
  LOADING: "loading",
};
