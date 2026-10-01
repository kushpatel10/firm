/**
 * Authentication Service
 * Handles Google OAuth flow and session management.
 * TODO: Connect to backend API endpoints.
 */

import { apiClient, storeToken, clearToken, parseJWT } from "@/lib/api-client";
import { getGoogleOAuthURL, getGoogleRedirectURI, isDevAuthBypass } from "@/lib/auth";

export const authService = {
  /**
   * Get the Google OAuth consent URL
   * @returns {string}
   */
  getGoogleAuthUrl() {
    return getGoogleOAuthURL();
  },


  /**
   * Handle the OAuth callback — send auth code to backend
   * @param {string} code - Google authorization code
   * @returns {Promise<import('@/types/auth.types').LoginResponse>}
   */
  async handleCallback(code) {
    if (isDevAuthBypass()) {
      return { success: true, data: this.getDevSession() };
    }
    const redirectUri = getGoogleRedirectURI();
    const res = await apiClient.post("/auth/callback", { code, redirectUri });
    if (res?.data?.token) {
      storeToken(res.data.token);
    }
    return res;
  },

  /**
   * Validate the current session
   * @returns {Promise<import('@/types/auth.types').AuthSession|null>}
   */
  async validateSession() {
    if (typeof window !== "undefined") {
      const isExplicitlyLoggedOut =
        localStorage.getItem("firm_user_logged_out") === "true" ||
        sessionStorage.getItem("firm_user_logged_out") === "true";
      if (isExplicitlyLoggedOut) {
        return null;
      }
    }

    const { getToken } = await import("@/lib/api-client");
    const token = getToken();

    if (token) {
      try {
        const res = await apiClient.get("/auth/session");
        if (res?.data) return res.data;
      } catch {
        // Token invalid or backend offline
      }
    }

    if (isDevAuthBypass()) {
      return this.devLogin();
    }

    return null;
  },

  /**
   * Get the current authenticated user
   * @returns {Promise<import('@/types/auth.types').AuthUser|null>}
   */
  async getCurrentUser() {
    const session = await this.validateSession();
    return session?.user || null;
  },

  /**
   * Logout — clear token and notify backend
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore error during logout
    } finally {
      clearToken();
      if (typeof window !== "undefined") {
        localStorage.setItem("firm_user_logged_out", "true");
        sessionStorage.setItem("firm_user_logged_out", "true");
        localStorage.removeItem("firm_auth_token");
        localStorage.removeItem("token");
      }
    }
  },

  /**
   * Dev-mode login bypass — gets real JWT token from backend if running
   * @returns {Promise<import('@/types/auth.types').AuthSession>}
   */
  async devLogin() {
    try {
      const res = await apiClient.post("/auth/dev-login");
      if (res?.data?.token) {
        storeToken(res.data.token);
      }
      return res?.data || this.getDevSession();
    } catch (err) {
      if (
        err?.message?.includes("not available in production") ||
        err?.message?.includes("404")
      ) {
        throw new Error(
          "Developer Session Bypass is disabled on production servers. Please sign in using 'Continue with Google'."
        );
      }
      const fallback = this.getDevSession();
      storeToken(fallback.token);
      return fallback;
    }
  },

  /**
   * Dev-mode fallback session payload
   * @returns {import('@/types/auth.types').AuthSession}
   */
  getDevSession() {
    return {
      user: {
        id: "dev-user-001",
        email: process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "admin@example.com",
        name: "Dev Admin",
        avatar: null,
        isSuperAdmin: true,
        status: "ACTIVE",
      },
      firm: {
        id: "dev-firm-001",
        name: "Dev Firm",
        businessType: "Technology",
        currency: "INR",
        timezone: "Asia/Kolkata",
        status: "ACTIVE",
      },
      role: {
        id: "dev-role-001",
        name: "Owner",
        isSystem: true,
      },
      permissions: [
        "Sales.View", "Sales.Create", "Sales.Edit", "Sales.Delete",
        "Purchase.View", "Purchase.Create", "Purchase.Edit", "Purchase.Delete",
        "Expense.View", "Expense.Create", "Expense.Edit", "Expense.Delete",
        "Inventory.View", "Inventory.Create", "Inventory.Edit", "Inventory.Delete",
        "Customers.View", "Customers.Create", "Customers.Edit", "Customers.Delete",
        "Suppliers.View", "Suppliers.Create", "Suppliers.Edit", "Suppliers.Delete",
        "DeliveryChallans.View", "DeliveryChallans.Create", "DeliveryChallans.Edit", "DeliveryChallans.Delete",
        "Reports.View", "Settings.Manage", "Users.Manage",
      ],
      token: "dev-token",
    };
  },
};
