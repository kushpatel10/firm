/**
 * Delivery Challan Service
 * Handles CRUD operations for firm delivery challans.
 */

import { apiClient } from "@/lib/api-client";

export const deliveryChallanService = {
  async getAll(firmId, params = {}) {
    const res = await apiClient.get(`/firms/${firmId}/delivery-challans`, params);
    return res?.data || [];
  },

  async getById(firmId, id) {
    const res = await apiClient.get(`/firms/${firmId}/delivery-challans/${id}`);
    return res?.data || null;
  },

  async create(firmId, input) {
    const res = await apiClient.post(`/firms/${firmId}/delivery-challans`, input);
    return res?.data;
  },

  async update(firmId, id, input) {
    const res = await apiClient.put(`/firms/${firmId}/delivery-challans/${id}`, input);
    return res?.data;
  },

  async delete(firmId, id) {
    const res = await apiClient.delete(`/firms/${firmId}/delivery-challans/${id}`);
    return res?.data;
  },
};
