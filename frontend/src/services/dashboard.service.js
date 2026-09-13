/**
 * Dashboard Service
 * Handles fetching aggregated summary metrics for Firm & Admin dashboards.
 */

import { apiClient } from "@/lib/api-client";

export const dashboardService = {
  /**
   * Get firm dashboard summary
   * @param {string} firmId
   * @returns {Promise<any>}
   */
  async getFirmSummary(firmId) {
    try {
      const res = await apiClient.get(`/firm/${firmId}/summary`);
      return res?.data || null;
    } catch (err) {
      console.warn(`Could not fetch firm summary for ${firmId}:`, err?.message || err);
      return {
        stats: {
          totalSales: 0,
          salesCount: 0,
          totalPurchases: 0,
          purchasesCount: 0,
          totalExpenses: 0,
          expensesCount: 0,
          totalInventory: 0,
        },
        recentSales: [],
        recentActivity: [],
      };
    }
  },

  /**
   * Get admin dashboard summary
   * @returns {Promise<any>}
   */
  async getAdminSummary() {
    try {
      const res = await apiClient.get("/admin/summary");
      return res?.data || null;
    } catch (err) {
      console.warn("Could not fetch admin summary from backend:", err?.message || err);
      return {
        stats: {
          totalFirms: 1,
          activeUsers: 1,
          totalActivity: 0,
          storageUsage: "0.1 GB",
        },
        recentActivity: [],
      };
    }
  },
};
