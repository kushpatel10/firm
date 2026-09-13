/**
 * Branch Service
 * Handles CRUD operations for branches within a firm.
 * TODO: Connect to backend API endpoints.
 */

import { apiClient } from "@/lib/api-client";

export const branchService = {
  /** @returns {Promise<import('@/types/firm.types').Branch[]>} */
  async getByFirmId(firmId) {
    const res = await apiClient.get(`/firms/${firmId}/branches`);
    return res?.data || [];
  },

  /** @returns {Promise<import('@/types/firm.types').Branch>} */
  async create(input) {
    const res = await apiClient.post(`/firms/${input.firmId}/branches`, input);
    return res?.data;
  },

  /** @returns {Promise<import('@/types/firm.types').Branch>} */
  async update(firmId, branchId, input) {
    const res = await apiClient.put(`/firms/${firmId}/branches/${branchId}`, input);
    return res?.data;
  },

  /** @returns {Promise<void>} */
  async delete(firmId, branchId) {
    const res = await apiClient.delete(`/firms/${firmId}/branches/${branchId}`);
    return res?.data;
  },
};
