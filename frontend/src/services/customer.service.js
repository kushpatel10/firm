/**
 * Customer Service
 * Handles CRUD operations for firm customers.
 */

import { apiClient } from "@/lib/api-client";

export const customerService = {
  async getAll(firmId, params = {}) {
    const query = { limit: 100, ...params };
    const res = await apiClient.get(`/firms/${firmId}/customers`, query);
    return res?.data || [];
  },

  async getById(firmId, id) {
    const res = await apiClient.get(`/firms/${firmId}/customers/${id}`);
    return res?.data || null;
  },

  async create(firmId, input) {
    const res = await apiClient.post(`/firms/${firmId}/customers`, input);
    return res?.data;
  },

  async update(firmId, id, input) {
    const res = await apiClient.put(`/firms/${firmId}/customers/${id}`, input);
    return res?.data;
  },

  async delete(firmId, id) {
    const res = await apiClient.delete(`/firms/${firmId}/customers/${id}`);
    return res?.data;
  },
};
