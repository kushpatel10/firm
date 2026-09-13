/**
 * Activity Service
 * Handles activity log retrieval.
 * TODO: Connect to backend API endpoints.
 */

import { apiClient } from "@/lib/api-client";

export const activityService = {
  /** @returns {Promise<import('@/types/activity.types').ActivityLog[]>} */
  async getAll(filter = {}) {
    try {
      const res = await apiClient.get('/activity', filter);
      return res?.data || [];
    } catch {
      return [];
    }
  },

  /** @returns {Promise<import('@/types/activity.types').ActivityLog[]>} */
  async getByFirmId(firmId, filter = {}) {
    try {
      const res = await apiClient.get(`/activity/firm/${firmId}`, filter);
      return res?.data || [];
    } catch {
      return [];
    }
  },

  /** @returns {Promise<void>} */
  async log() {
    // Activity logging is handled by backend middleware automatically
  },
};
