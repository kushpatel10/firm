/**
 * Role Service
 * Handles CRUD for roles and permission assignment.
 * TODO: Connect to backend API endpoints.
 */

import { apiClient } from "@/lib/api-client";

export const roleService = {
  /** @returns {Promise<import('@/types/role.types').Role[]>} */
  async getAll(params = {}) {
    const res = await apiClient.get('/roles', params);
    return res?.data || [];
  },

  /** @returns {Promise<import('@/types/role.types').Role[]>} */
  async getByFirmId(firmId) {
    const res = await apiClient.get('/roles', { firmId });
    return res?.data || [];
  },

  /** @returns {Promise<import('@/types/role.types').Role>} */
  async create(input) {
    const res = await apiClient.post('/roles', input);
    return res?.data;
  },

  /** @returns {Promise<import('@/types/role.types').Role>} */
  async update(id, input) {
    const res = await apiClient.put(`/roles/${id}`, input);
    return res?.data;
  },

  /** @returns {Promise<void>} */
  async delete(id) {
    const res = await apiClient.delete(`/roles/${id}`);
    return res?.data;
  },

  /** @returns {Promise<import('@/types/role.types').Permission[]>} */
  async getPermissions() {
    const res = await apiClient.get('/roles/permissions');
    return res?.data || [];
  },

  /** @returns {Promise<void>} */
  async assignPermissions(roleId, permissionIds) {
    const res = await apiClient.put(`/roles/${roleId}/permissions`, { permissionIds });
    return res?.data;
  },
};
