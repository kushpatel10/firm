/**
 * Sales Service
 * TODO: Connect to backend API endpoints.
 */

import { apiClient } from "@/lib/api-client";

export const salesService = {
  /** @returns {Promise<import('@/types/sales.types').Sale[]>} */
  async getAll(firmId, branchId = null) {
    const res = await apiClient.get(`/firms/${firmId}/sales`, { branchId });
    return res?.data || [];
  },

  async getById(firmId, id) {
    const res = await apiClient.get(`/firms/${firmId}/sales/${id}`);
    return res?.data || null;
  },

  async create(firmId, input) {
    const res = await apiClient.post(`/firms/${firmId}/sales`, input);
    return res?.data;
  },

  async update(firmId, id, input) {
    const res = await apiClient.put(`/firms/${firmId}/sales/${id}`, input);
    return res?.data;
  },

  async delete(firmId, id) {
    const res = await apiClient.delete(`/firms/${firmId}/sales/${id}`);
    return res?.data;
  },
};
