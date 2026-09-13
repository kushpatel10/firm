/**
 * User Service
 * Handles CRUD operations for users.
 * TODO: Connect to backend API endpoints.
 */

import { apiClient } from "@/lib/api-client";

export const userService = {
  /** @returns {Promise<import('@/types/user.types').User[]>} */
  async getAll(params = {}) {
    const res = await apiClient.get('/users', params);
    return res?.data || [];
  },

  /** @returns {Promise<import('@/types/user.types').User[]>} */
  async getByFirmId(firmId, params = {}) {
    const res = await apiClient.get(`/users/firm/${firmId}`, params);
    return res?.data || [];
  },

  /** @returns {Promise<import('@/types/user.types').User>} */
  async getById(id) {
    const res = await apiClient.get(`/users/${id}`);
    return res?.data || null;
  },

  /** @returns {Promise<import('@/types/user.types').User>} */
  async create(input) {
    const res = await apiClient.post('/users', input);
    return res?.data;
  },

  /** @returns {Promise<import('@/types/user.types').User>} */
  async update(id, input) {
    const res = await apiClient.put(`/users/${id}`, input);
    return res?.data;
  },

  /** @returns {Promise<void>} */
  async deactivate(id) {
    const res = await apiClient.patch(`/users/${id}/deactivate`);
    return res?.data;
  },

  /** @returns {Promise<void>} */
  async resetAccess(id) {
    const res = await apiClient.post(`/users/${id}/reset-access`);
    return res?.data;
  },

  /** @returns {Promise<any>} */
  async inviteToFirm(firmId, input) {
    const res = await apiClient.post(`/users/firm/${firmId}/invite`, input);
    return res?.data;
  },
};

