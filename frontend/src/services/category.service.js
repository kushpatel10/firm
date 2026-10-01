import { apiClient } from "@/lib/api-client";

export const categoryService = {
  async getAll(firmId) {
    if (!firmId) return [];
    try {
      const res = await apiClient.get(`/firms/${firmId}/categories`);
      return res?.data || [];
    } catch (err) {
      console.warn("Failed to fetch categories, falling back to defaults:", err.message);
      return [];
    }
  },

  async getById(firmId, id) {
    if (!firmId || !id) return null;
    try {
      const res = await apiClient.get(`/firms/${firmId}/categories/${id}`);
      return res?.data || null;
    } catch (err) {
      console.warn(`Failed to fetch category ${id}:`, err.message);
      return null;
    }
  },

  async create(firmId, data) {
    const res = await apiClient.post(`/firms/${firmId}/categories`, data);
    return res?.data;
  },

  async update(firmId, id, data) {
    const res = await apiClient.put(`/firms/${firmId}/categories/${id}`, data);
    return res?.data;
  },

  async delete(firmId, id) {
    const res = await apiClient.delete(`/firms/${firmId}/categories/${id}`);
    return res?.data;
  },

  async addSizePreset(firmId, categoryId, data) {
    const res = await apiClient.post(`/firms/${firmId}/categories/${categoryId}/size-presets`, data);
    return res?.data;
  },
};
