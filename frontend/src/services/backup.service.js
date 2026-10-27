/**
 * Backup and Restore Service (Frontend)
 * Communicates with backend backup endpoints for Google Drive syncing,
 * manual export, dry-run inspection, and atomic restores.
 */

import { apiClient } from "@/lib/api-client";

export const backupService = {
  /**
   * Get backup configuration for firm
   * @param {string} firmId
   */
  async getConfig(firmId) {
    const res = await apiClient.get(`/firms/${firmId}/backup/config`);
    return res?.data;
  },

  /**
   * Update backup configuration
   * @param {string} firmId
   * @param {Object} data
   */
  async updateConfig(firmId, data) {
    const res = await apiClient.put(`/firms/${firmId}/backup/config`, data);
    return res?.data;
  },

  /**
   * Get Google Drive OAuth authorization URL
   * @param {string} firmId
   * @param {string} [returnUrl]
   */
  async getGoogleAuthUrl(firmId, returnUrl = null) {
    const params = returnUrl ? { returnUrl } : {};
    const res = await apiClient.get(`/firms/${firmId}/backup/google/auth-url`, params);
    return res?.data?.authUrl;
  },

  /**
   * Handle Google OAuth callback
   * @param {string} firmId
   * @param {string} code
   * @param {string} [redirectUri]
   */
  async handleGoogleCallback(firmId, code, redirectUri = null) {
    const res = await apiClient.post(`/firms/${firmId}/backup/google/callback`, {
      code,
      redirectUri,
    });
    return res?.data;
  },

  /**
   * Disconnect Google Drive
   * @param {string} firmId
   */
  async disconnectGoogle(firmId) {
    const res = await apiClient.post(`/firms/${firmId}/backup/google/disconnect`, {});
    return res?.data;
  },

  /**
   * Trigger immediate backup export
   * @param {string} firmId
   * @param {Object} options - { passphrase, uploadToDrive }
   */
  async exportNow(firmId, options = {}) {
    const res = await apiClient.post(`/firms/${firmId}/backup/export-now`, options);
    return res?.data;
  },

  /**
   * Download immediate backup file directly
   * @param {string} firmId
   * @param {string} [passphrase]
   */
  async downloadExport(firmId, passphrase = "") {
    const token = typeof window !== "undefined" ? localStorage.getItem("firm_auth_token") : null;
    const res = await fetch(`/api/firms/${firmId}/backup/export-now`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ passphrase, uploadToDrive: false, download: true }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to download backup");
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    let filename = `Firm_Backup_${new Date().toISOString().slice(0, 10)}.firmbak`;
    if (disposition && disposition.includes("filename=")) {
      filename = disposition.split("filename=")[1].replace(/["']/g, "").trim();
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * List files in Google Drive backup folder
   * @param {string} firmId
   */
  async getDriveFiles(firmId) {
    const res = await apiClient.get(`/firms/${firmId}/backup/drive-files`);
    return res?.data || { files: [], isConnected: false };
  },

  /**
   * Download a backup file from Google Drive
   * @param {string} firmId
   * @param {string} fileId
   * @param {string} fileName
   */
  async downloadDriveFile(firmId, fileId, fileName) {
    const token = typeof window !== "undefined" ? localStorage.getItem("firm_auth_token") : null;
    const res = await fetch(`/api/firms/${firmId}/backup/drive-files/${fileId}/download`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      throw new Error("Failed to download file from Google Drive");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || `backup_${fileId}.firmbak`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Pre-Restore Dry-Run Verification
   * @param {string} firmId
   * @param {FormData|Object} payload
   */
  async verifyBackup(firmId, payload) {
    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      const res = await apiClient.postFormData(`/firms/${firmId}/backup/verify`, payload);
      return res?.data;
    }
    const res = await apiClient.post(`/firms/${firmId}/backup/verify`, payload);
    return res?.data;
  },

  /**
   * Execute atomic restoration
   * @param {string} firmId
   * @param {FormData|Object} payload
   */
  async restoreBackup(firmId, payload) {
    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      const res = await apiClient.postFormData(`/firms/${firmId}/backup/restore`, payload);
      return res?.data;
    }
    const res = await apiClient.post(`/firms/${firmId}/backup/restore`, payload);
    return res?.data;
  },

  /**
   * Get backup audit history
   * @param {string} firmId
   * @param {Object} [params]
   */
  async getHistory(firmId, params = {}) {
    const res = await apiClient.get(`/firms/${firmId}/backup/history`, params);
    return res || { data: [], total: 0 };
  },
};
