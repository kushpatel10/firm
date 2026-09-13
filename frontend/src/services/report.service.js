/**
 * Report Service
 * TODO: Connect to backend API endpoints.
 */

import { apiClient } from "@/lib/api-client";

export const reportService = {
  async getSalesReport(filter) {
    const res = await apiClient.get(`/firms/${filter.firmId}/reports/sales`, filter);
    return res?.data || null;
  },

  async getPurchaseReport(filter) {
    const res = await apiClient.get(`/firms/${filter.firmId}/reports/purchases`, filter);
    return res?.data || null;
  },

  async getExpenseReport(filter) {
    const res = await apiClient.get(`/firms/${filter.firmId}/reports/expenses`, filter);
    return res?.data || null;
  },

  async getInventoryReport(filter) {
    const res = await apiClient.get(`/firms/${filter.firmId}/reports/inventory`, filter);
    return res?.data || null;
  },
};
