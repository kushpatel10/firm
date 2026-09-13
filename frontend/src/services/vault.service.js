import { apiClient } from "@/lib/api-client";

export const vaultService = {
  async getStatus(firmId) {
    const res = await apiClient.get(`/firms/${firmId}/vault/status`);
    return res?.data;
  },

  async unlock(firmId, privateKey, ttlHours = 48) {
    const res = await apiClient.post(`/firms/${firmId}/vault/unlock`, { privateKey, ttlHours });
    return res?.data;
  },

  async lock(firmId) {
    const res = await apiClient.post(`/firms/${firmId}/vault/lock`);
    return res?.data;
  },

  async generateKeypair(firmId) {
    const res = await apiClient.post(`/firms/${firmId}/vault/generate-keypair`);
    return res?.data;
  },
};
