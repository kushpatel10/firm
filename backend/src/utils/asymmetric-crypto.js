/**
 * Asymmetric RSA-2048 + AES-256-GCM Hybrid Encryption Utility
 * Native Node.js crypto implementation.
 *
 * - Public Key: Encrypts data 24/7 without needing the Private Key.
 * - Private Key: Held in volatile RAM to decrypt data when unlocked.
 */

const crypto = require("crypto");
const { promisify } = require("util");
const generateKeyPairPromise = promisify(crypto.generateKeyPair);

/**
 * Generate a new RSA-2048 key pair asynchronously (non-blocking).
 * @returns {Promise<{ publicKeyPem: string, privateKeyPem: string }>}
 */
async function generateFirmKeyPairAsync() {
  const { publicKey, privateKey } = await generateKeyPairPromise("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return {
    publicKeyPem: publicKey,
    privateKeyPem: privateKey,
  };
}

/**
 * Generate a new RSA-2048 key pair for a Firm (synchronous fallback).
 * @returns {{ publicKeyPem: string, privateKeyPem: string }}
 */
function generateFirmKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return {
    publicKeyPem: publicKey,
    privateKeyPem: privateKey,
  };
}

/**
 * Hybrid Encryption: Encrypt text using Firm Public Key.
 * Uses AES-256-GCM for the data payload, and RSA-OAEP to encrypt the AES key.
 * Format: enc:rsa:<encryptedAesKeyHex>:<ivHex>:<authTagHex>:<ciphertextHex>
 *
 * @param {string} text - Plain text to encrypt
 * @param {string} publicKeyPem - RSA Public Key in PEM format
 * @returns {string} Encrypted ciphertext string
 */
function encryptWithPublicKey(text, publicKeyPem) {
  if (!text || typeof text !== "string") return text;
  if (!publicKeyPem) return text;

  try {
    // 1. Generate random 256-bit AES key & 12-byte IV for payload
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    // 2. Encrypt payload with AES-256-GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
    let ciphertext = cipher.update(text, "utf8", "hex");
    ciphertext += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    // 3. Encrypt AES key with RSA Public Key (RSA-OAEP with SHA-256)
    const encryptedAesKey = crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      aesKey
    ).toString("hex");

    return `enc:rsa:${encryptedAesKey}:${iv.toString("hex")}:${authTag}:${ciphertext}`;
  } catch (err) {
    console.error("Encryption error:", err.message);
    return text;
  }
}

// Bounded in-memory decryption cache (up to 5,000 entries)
// Eliminates repetitive CPU-intensive RSA-OAEP private key operations on list/pagination requests
const decryptionCache = new Map();
const MAX_DECRYPT_CACHE_SIZE = 5000;

function clearDecryptionCache() {
  decryptionCache.clear();
}

/**
 * Hybrid Decryption: Decrypt ciphertext string using Firm Private Key.
 *
 * @param {string} encryptedStr - Format: enc:rsa:<encryptedAesKeyHex>:<ivHex>:<authTagHex>:<ciphertextHex>
 * @param {string} privateKeyPem - RSA Private Key in PEM format
 * @returns {string} Decrypted plain text or placeholder if vault is locked
 */
function decryptWithPrivateKey(encryptedStr, privateKeyPem) {
  if (!encryptedStr || typeof encryptedStr !== "string") return encryptedStr;

  // Return plain text legacy records as-is
  if (!encryptedStr.startsWith("enc:rsa:")) {
    return encryptedStr;
  }

  if (!privateKeyPem) {
    return "[🔒 Encrypted Data - Unlock Vault to View]";
  }

  // Fast path: Check cache first (< 0.01ms)
  if (decryptionCache.has(encryptedStr)) {
    return decryptionCache.get(encryptedStr);
  }

  try {
    const parts = encryptedStr.split(":");
    if (parts.length !== 6) return encryptedStr;

    const [_, __, encryptedAesKeyHex, ivHex, authTagHex, ciphertextHex] = parts;

    // 1. Decrypt AES Key using RSA Private Key
    const aesKey = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(encryptedAesKeyHex, "hex")
    );

    // 2. Decrypt Payload using AES-256-GCM
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      aesKey,
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    let plainText = decipher.update(ciphertextHex, "hex", "utf8");
    plainText += decipher.final("utf8");

    // Maintain bounded cache size
    if (decryptionCache.size >= MAX_DECRYPT_CACHE_SIZE) {
      const oldestKey = decryptionCache.keys().next().value;
      if (oldestKey) decryptionCache.delete(oldestKey);
    }
    decryptionCache.set(encryptedStr, plainText);

    return plainText;
  } catch (err) {
    console.error("Decryption error:", err.message);
    return "[🔒 Decryption Failed]";
  }
}

module.exports = {
  generateFirmKeyPair,
  generateFirmKeyPairAsync,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  clearDecryptionCache,
};
