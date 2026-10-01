/**
 * Key Vault Service (Disabled)
 */

export const vaultService = {
  async getStatus() {
    return { unlocked: true, timeRemainingMs: 86400000 };
  },

  async unlock() {
    return { unlocked: true };
  },

  async lock() {
    return { unlocked: false };
  },

  async generateKeypair() {
    return {};
  },
};
