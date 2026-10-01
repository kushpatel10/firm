/**
 * Supplier Service
 * Handles CRUD operations for firm suppliers.
 */

import { apiClient } from "@/lib/api-client";

export const supplierService = {
  async getAll(firmId, params = {}) {
    const query = { limit: 100, ...params };
    const res = await apiClient.get(`/firms/${firmId}/suppliers`, query);
    return res?.data || [];
  },

  async getById(firmId, id) {
    const res = await apiClient.get(`/firms/${firmId}/suppliers/${id}`);
    return res?.data || null;
  },

  async create(firmId, input) {
    const res = await apiClient.post(`/firms/${firmId}/suppliers`, input);
    return res?.data;
  },

  async update(firmId, id, input) {
    const res = await apiClient.put(`/firms/${firmId}/suppliers/${id}`, input);
    return res?.data;
  },

  async delete(firmId, id) {
    const res = await apiClient.delete(`/firms/${firmId}/suppliers/${id}`);
    return res?.data;
  },
};
