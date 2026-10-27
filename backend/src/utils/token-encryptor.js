/**
 * Token and Secret Encryption Utility
 * Encrypts and decrypts sensitive backend tokens (e.g. Google Drive refresh tokens)
 * at rest using AES-256-GCM keyed by the server's master secret.
 */

const crypto = require("crypto");
const config = require("../config/env");

const MASTER_SECRET = process.env.BACKUP_MASTER_KEY || config.jwtSecret || "firm-secure-master-token-key-2026";
// Deterministically derive a 32-byte (256-bit) encryption key
const KEY = crypto.createHash("sha256").update(MASTER_SECRET).digest();

/**
 * Encrypts plaintext string using AES-256-GCM.
 * @param {string} plaintext
 * @returns {string} Encrypted token string (format: iv:authTag:ciphertext in base64)
 */
function encryptSecret(plaintext) {
  if (!plaintext) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf8")),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

/**
 * Decrypts ciphertext string using AES-256-GCM.
 * @param {string} ciphertext
 * @returns {string} Original plaintext string
 */
function decryptSecret(ciphertext) {
  if (!ciphertext) return null;

  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    // If not in the iv:authTag:ciphertext format, return as-is (e.g. legacy/unencrypted)
    return ciphertext;
  }

  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const encrypted = Buffer.from(encryptedBase64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

module.exports = {
  encryptSecret,
  decryptSecret,
};
