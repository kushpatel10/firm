/**
 * Firm Service
 * Handles CRUD operations for firms.
 * TODO: Connect to backend API endpoints.
 */

import { apiClient } from "@/lib/api-client";

export const firmService = {
  /**
   * Get all firms (Super Admin only)
   * @param {object} [params] - Query params (page, pageSize, search, status)
   * @returns {Promise<import('@/types/firm.types').Firm[]>}
   */
  async getAll(params = {}) {
    const res = await apiClient.get('/firms', params);
    return res?.data || [];
  },

  /**
   * Get a firm by ID
   * @param {string} id
   * @returns {Promise<import('@/types/firm.types').Firm|null>}
   */
  async getById(id) {
    const res = await apiClient.get(`/firms/${id}`);
    return res?.data || null;
  },

  /**
   * Create a new firm
   * @param {import('@/types/firm.types').CreateFirmInput} input
   * @returns {Promise<import('@/types/firm.types').Firm>}
   */
  async create(input) {
    const res = await apiClient.post('/firms', input);
    return res?.data;
  },

  /**
   * Update a firm
   * @param {string} id
   * @param {import('@/types/firm.types').UpdateFirmInput} input
   * @returns {Promise<import('@/types/firm.types').Firm>}
   */
  async update(id, input) {
    const res = await apiClient.put(`/firms/${id}`, input);
    return res?.data;
  },

  /**
   * Archive a firm
   * @param {string} id
   * @returns {Promise<void>}
   */
  async archive(id) {
    const res = await apiClient.patch(`/firms/${id}/archive`);
    return res?.data;
  },

  /**
   * Delete a firm
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    const res = await apiClient.delete(`/firms/${id}`);
    return res?.data;
  },
};
