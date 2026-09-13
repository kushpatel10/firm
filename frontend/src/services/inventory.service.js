/**
 * Inventory Service
 * TODO: Connect to backend API endpoints.
 */

import { apiClient } from "@/lib/api-client";

export const inventoryService = {
  async getAll(firmId, branchId = null) {
    const res = await apiClient.get(`/firms/${firmId}/inventory`, { branchId });
    return res?.data || [];
  },

  async getById(firmId, id) {
    const res = await apiClient.get(`/firms/${firmId}/inventory/${id}`);
    return res?.data || null;
  },

  async create(firmId, input) {
    const res = await apiClient.post(`/firms/${firmId}/inventory`, input);
    return res?.data;
  },

  async update(firmId, id, input) {
    const res = await apiClient.put(`/firms/${firmId}/inventory/${id}`, input);
    return res?.data;
  },

  async getLowStock(firmId) {
    const res = await apiClient.get(`/firms/${firmId}/inventory/low-stock`);
    return res?.data || [];
  },

  async delete(firmId, id) {
    const res = await apiClient.delete(`/firms/${firmId}/inventory/${id}`);
    return res?.data;
  },
};
