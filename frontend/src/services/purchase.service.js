/**
 * Purchase Service
 * TODO: Connect to backend API endpoints.
 */

import { apiClient } from "@/lib/api-client";

export const purchaseService = {
  async getAll(firmId, branchIdOrParams = null) {
    const params = typeof branchIdOrParams === "object" && branchIdOrParams !== null
      ? { limit: 100, ...branchIdOrParams }
      : { limit: 100, ...(branchIdOrParams ? { branchId: branchIdOrParams } : {}) };
    const res = await apiClient.get(`/firms/${firmId}/purchases`, params);
    return res?.data || [];
  },

  async getById(firmId, id) {
    const res = await apiClient.get(`/firms/${firmId}/purchases/${id}`);
    return res?.data || null;
  },

  async create(firmId, input) {
    const res = await apiClient.post(`/firms/${firmId}/purchases`, input);
    return res?.data;
  },

  async update(firmId, id, input) {
    const res = await apiClient.put(`/firms/${firmId}/purchases/${id}`, input);
    return res?.data;
  },

  async delete(firmId, id) {
    const res = await apiClient.delete(`/firms/${firmId}/purchases/${id}`);
    return res?.data;
  },
};
