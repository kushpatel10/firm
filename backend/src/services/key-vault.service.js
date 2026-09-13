/**
 * Ephemeral RAM Private Key Vault Service
 *
 * Stores firm RSA private keys exclusively in server memory (RAM) with automatic TTL expiration.
 * Keys are never written to disk. On RAM purge, server restart, or TTL lapse, keys disappear.
 */

// In-memory vault store: Map<firmId, { privateKeyPem: string, expiresAt: Date, timerId: NodeJS.Timeout }>
const vaultStore = new Map();
const asymmetricCrypto = require("../utils/asymmetric-crypto");

/**
 * Unlock vault by storing the Private Key in server RAM for a configurable duration.
 *
 * @param {string} firmId - Firm ID
 * @param {string} privateKeyPem - RSA Private Key in PEM format
 * @param {number} ttlHours - Expiry duration in hours (default 48 hours / 2 days)
 * @returns {{ unlocked: boolean, expiresAt: Date }}
 */
function unlockVault(firmId, privateKeyPem, ttlHours = 48) {
  if (!firmId || !privateKeyPem) {
    throw new Error("Firm ID and Private Key are required to unlock vault.");
  }

  // Clear existing timer if any
  if (vaultStore.has(firmId)) {
    const existing = vaultStore.get(firmId);
    if (existing.timerId) clearTimeout(existing.timerId);
  }

  const durationMs = Math.max(1, ttlHours) * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + durationMs);

  // Set automatic purge timer
  const timerId = setTimeout(() => {
    lockVault(firmId);
    console.log(`[Key Vault] Ephemeral RAM TTL expired for Firm: ${firmId}. Vault locked.`);
  }, durationMs);

  vaultStore.set(firmId, {
    privateKeyPem,
    expiresAt,
    timerId,
  });

  console.log(`[Key Vault] Firm ${firmId} unlocked in ephemeral RAM until ${expiresAt.toISOString()}`);
  return { unlocked: true, expiresAt };
}

/**
 * Retrieve the active Private Key from RAM if unlocked and not expired.
 *
 * @param {string} firmId
 * @returns {string | null} PEM string or null if locked/expired
 */
function getPrivateKey(firmId) {
  if (!firmId || !vaultStore.has(firmId)) return null;

  const entry = vaultStore.get(firmId);
  if (new Date() >= entry.expiresAt) {
    lockVault(firmId);
    return null;
  }

  return entry.privateKeyPem;
}

/**
 * Lock vault by immediately purging private key from RAM memory.
 *
 * @param {string} firmId
 */
function lockVault(firmId) {
  if (vaultStore.has(firmId)) {
    const entry = vaultStore.get(firmId);
    if (entry.timerId) clearTimeout(entry.timerId);
    vaultStore.delete(firmId);
    asymmetricCrypto.clearDecryptionCache();
    console.log(`[Key Vault] RAM key purged for Firm: ${firmId}`);
  }
}

/**
 * Check vault lock status for a firm.
 *
 * @param {string} firmId
 * @returns {{ unlocked: boolean, expiresAt: Date | null, timeRemainingMs: number }}
 */
function getStatus(firmId) {
  if (!firmId || !vaultStore.has(firmId)) {
    return { unlocked: false, expiresAt: null, timeRemainingMs: 0 };
  }

  const entry = vaultStore.get(firmId);
  const now = new Date();
  const timeRemainingMs = Math.max(0, entry.expiresAt.getTime() - now.getTime());

  if (timeRemainingMs === 0) {
    lockVault(firmId);
    return { unlocked: false, expiresAt: null, timeRemainingMs: 0 };
  }

  return {
    unlocked: true,
    expiresAt: entry.expiresAt,
    timeRemainingMs,
  };
}

module.exports = {
  unlockVault,
  getPrivateKey,
  lockVault,
  getStatus,
};
