/**
 * API Client — Base HTTP client for backend API calls.
 * Automatically attaches JWT authorization headers.
 * Handles 401 (redirect to login) and 403 (redirect to access-denied).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/**
 * Get stored JWT token
 * @returns {string|null}
 */
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("firm_auth_token");
}

/**
 * Store JWT token
 * @param {string} token
 */
export function storeToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem("firm_auth_token", token);
}

/**
 * Clear stored JWT token
 */
export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("firm_auth_token");
}

/**
 * Parse JWT payload (without verification — verification happens on backend)
 * @param {string} token
 * @returns {object|null}
 */
export function parseJWT(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isNativeCapacitor() {
  if (typeof window === "undefined") return false;
  if (window.location.protocol === "capacitor:") return true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Capacitor } = require("@capacitor/core");
    return typeof Capacitor?.isNativePlatform === "function" ? Capacitor.isNativePlatform() : false;
  } catch {
    return false;
  }
}

export function normalizeServerUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  let url = rawUrl.trim();
  if (!url) return null;

  // Add protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    if (url.startsWith("localhost") || url.startsWith("127.0.0.1") || /^192\.168\./.test(url) || /^10\./.test(url)) {
      url = `http://${url}`;
    } else {
      url = `https://${url}`;
    }
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  // Determine base and API URLs
  let baseUrl = url;
  let apiUrl = url;

  if (url.toLowerCase().endsWith("/api")) {
    baseUrl = url.slice(0, -4);
    apiUrl = url;
  } else {
    baseUrl = url;
    apiUrl = `${url}/api`;
  }

  return { baseUrl, apiUrl };
}

export function getStoredVpsUrl() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("firm_vps_url") || window.localStorage.getItem("firm_api_url") || null;
}

export function setApiBaseUrl(rawUrl) {
  if (typeof window === "undefined") return null;
  const normalized = normalizeServerUrl(rawUrl);
  if (!normalized) return null;

  window.localStorage.setItem("firm_vps_url", normalized.baseUrl);
  window.localStorage.setItem("firm_api_url", normalized.apiUrl);
  return normalized;
}

export function clearApiBaseUrl() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("firm_vps_url");
  window.localStorage.removeItem("firm_api_url");
}

export async function testServerConnection(rawUrl) {
  const normalized = normalizeServerUrl(rawUrl);
  if (!normalized) {
    return { success: false, error: "Please enter a valid server URL" };
  }

  const testUrl = `${normalized.apiUrl}/health`;
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(testUrl, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    const latency = Math.round(endTime - startTime);

    if (res.ok) {
      let body = {};
      try {
        body = await res.json();
      } catch {}
      return {
        success: true,
        latency,
        version: body?.version || "1.0.0",
        service: body?.service || "Firm API",
        apiUrl: normalized.apiUrl,
        baseUrl: normalized.baseUrl,
      };
    } else {
      return {
        success: false,
        error: `Server responded with HTTP ${res.status}: ${res.statusText}`,
        apiUrl: normalized.apiUrl,
      };
    }
  } catch (err) {
    const isTimeout = err?.name === "AbortError";
    return {
      success: false,
      error: isTimeout
        ? "Connection timed out (8s). Check server URL and network."
        : `Could not reach server: ${err?.message || "Network error"}`,
      apiUrl: normalized.apiUrl,
    };
  }
}

export function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    const isCapacitor = isNativeCapacitor();
    const overrideUrl = window.localStorage.getItem("firm_api_url");

    if (overrideUrl) {
      if (overrideUrl.includes("10.0.2.2") && !isCapacitor) {
        window.localStorage.removeItem("firm_api_url");
      } else {
        return overrideUrl;
      }
    }

    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    let envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

    // Native Capacitor mobile platform — default localhost points to Android emulator host (10.0.2.2)
    if (isCapacitor) {
      return envUrl.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
    }

    // In all web browsers (Cloudflare Tunnel, custom domain, VPS IP, or localhost),
    // always route through same-origin `/api` which Next.js reverse-proxies to Express.
    // This eliminates CORS issues and means only 1 public port (3000) needs to be exposed/tunneled.
    return `${window.location.origin}/api`;
  }

  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
}

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., "/firms")
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>}
 */
async function request(endpoint, options = {}) {
  const token = getToken();
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error(`Failed to fetch (${url}): ${err?.message || "Backend server unreachable"}`);
  }

  // Handle authentication errors
  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      localStorage.setItem("firm_user_logged_out", "true");
      sessionStorage.setItem("firm_user_logged_out", "true");
      const currentPath = window.location.pathname;
      if (
        !endpoint.startsWith("/auth/") &&
        !currentPath.startsWith("/login") &&
        !currentPath.startsWith("/callback") &&
        !currentPath.startsWith("/access-denied")
      ) {
        window.location.replace("/login");
      }
    }
    throw new Error("Unauthorized");
  }

  // Handle forbidden
  if (response.status === 403) {
    throw new Error("Access Denied");
  }

  // Handle no content
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status}`);
  }

  return data;
}

/**
 * API client with convenience methods
 */
export const apiClient = {
  /**
   * @param {string} endpoint
   * @param {object} params - Query parameters
   * @returns {Promise<any>}
   */
  get(endpoint, params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const query = searchParams.toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return request(url, { method: "GET" });
  },

  /**
   * @param {string} endpoint
   * @param {object} body
   * @returns {Promise<any>}
   */
  post(endpoint, body) {
    return request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  /**
   * @param {string} endpoint
   * @param {object} body
   * @returns {Promise<any>}
   */
  put(endpoint, body) {
    return request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  /**
   * @param {string} endpoint
   * @param {object} body
   * @returns {Promise<any>}
   */
  patch(endpoint, body) {
    return request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  /**
   * @param {string} endpoint
   * @returns {Promise<any>}
   */
  delete(endpoint) {
    return request(endpoint, { method: "DELETE" });
  },
};
