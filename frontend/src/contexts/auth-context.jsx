"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { isDevAuthBypass } from "@/lib/auth";
import { storeToken } from "@/lib/api-client";

/** Returns true only when running inside a Capacitor native shell */
function isNative() {
  if (typeof window === "undefined") return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Capacitor } = require("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

// Register native deep link listener at module load time — only on native
if (typeof window !== "undefined" && isNative()) {
  import("@capacitor/app")
    .then(({ App: CapacitorApp }) => {
      CapacitorApp.addListener("appUrlOpen", (data) => {
        if (data?.url) {
          const match = data.url.match(/token=([^&]+)/);
          if (match) {
            localStorage.removeItem("firm_user_logged_out");
            sessionStorage.removeItem("firm_user_logged_out");
            localStorage.setItem("firm_consumed_launch_url", data.url);
            const token = decodeURIComponent(match[1]);
            storeToken(token);
            window.dispatchEvent(new CustomEvent("firm_auth_token_received", { detail: { token } }));
            // Close in-app browser overlay if active
            import("@capacitor/browser")
              .then(({ Browser }) => Browser.close())
              .catch(() => {});
          }
        }
      });
    })
    .catch(() => {});
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [firm, setFirm] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Dev-mode or mobile session login helper
   */
  const devLogin = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("firm_user_logged_out");
      sessionStorage.removeItem("firm_user_logged_out");
    }
    const session = await authService.devLogin();
    if (session) {
      setUser(session.user);
      setFirm(session.firm);
      setRole(session.role);
      setPermissions(session.permissions || []);
      setIsAuthenticated(true);
    }
    return session;
  }, []);


  const restoreSession = useCallback(async () => {
    try {
      const session = await authService.validateSession();
      if (session) {
        setUser(session.user);
        setFirm(session.firm);
        setRole(session.role);
        setPermissions(session.permissions || []);
        setIsAuthenticated(true);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

  // Handle native deep link URLs (com.firm.app://callback?token=...)
  useEffect(() => {
    const handleEvent = async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("firm_user_logged_out");
        sessionStorage.removeItem("firm_user_logged_out");
      }
      await restoreSession();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("firm_auth_token_received", handleEvent);
    }

    // Check cold start launch URL — native only
    async function checkLaunchUrl() {
      if (!isNative()) return;
      if (typeof window !== "undefined") {
        const isLoggedOut =
          localStorage.getItem("firm_user_logged_out") === "true" ||
          sessionStorage.getItem("firm_user_logged_out") === "true";
        if (isLoggedOut) return;
      }
      try {
        const { App: CapacitorApp } = await import("@capacitor/app");
        const launchUrl = await CapacitorApp.getLaunchUrl();
        if (launchUrl?.url) {
          const lastConsumed = typeof window !== "undefined" ? localStorage.getItem("firm_consumed_launch_url") : null;
          if (launchUrl.url === lastConsumed) {
            return;
          }
          const match = launchUrl.url.match(/token=([^&]+)/);
          if (match) {
            if (typeof window !== "undefined") {
              localStorage.setItem("firm_consumed_launch_url", launchUrl.url);
              localStorage.removeItem("firm_user_logged_out");
              sessionStorage.removeItem("firm_user_logged_out");
            }
            const token = decodeURIComponent(match[1]);
            storeToken(token);
            await restoreSession();
          }
        }
      } catch {}
    }
    checkLaunchUrl();

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("firm_auth_token_received", handleEvent);
      }
    };
  }, [restoreSession]);

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      try {
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/callback")) {
          // On callback page, we are in the middle of exchanging a new OAuth code. Skip validating old token.
          setLoading(false);
          return;
        }

        const isLoggedOut =
          typeof window !== "undefined" &&
          (localStorage.getItem("firm_user_logged_out") === "true" ||
            sessionStorage.getItem("firm_user_logged_out") === "true");

        if (isLoggedOut) {
          setUser(null);
          setFirm(null);
          setRole(null);
          setPermissions([]);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Restore active session if valid token exists in storage
        await restoreSession();
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [restoreSession]);

  const login = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("firm_user_logged_out");
      sessionStorage.removeItem("firm_user_logged_out");
    }

    const isCapacitorNative =
      typeof window !== "undefined" &&
      (isNative() || window.location.protocol === "capacitor:");

    if (isDevAuthBypass() || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      return await devLogin();
    }

    const url = authService.getGoogleAuthUrl();
    if (typeof window !== "undefined") {
      if (isCapacitorNative) {
        try {
          const { Browser } = await import("@capacitor/browser");
          await Browser.open({ url });
          return;
        } catch {}
      }
      window.location.href = url;
    }
  }, [devLogin]);

  /**
   * Complete authentication callback with code from Google
   */
  const handleCallback = useCallback(async (code) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("firm_user_logged_out");
      sessionStorage.removeItem("firm_user_logged_out");
    }
    const res = await authService.handleCallback(code);
    if (res?.success && res?.data) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("firm_user_logged_out");
        sessionStorage.removeItem("firm_user_logged_out");
      }
      const { user, firm, role, permissions } = res.data;
      setUser(user || null);
      setFirm(firm || null);
      setRole(role || null);
      setPermissions(permissions || []);
      setIsAuthenticated(true);
      return res.data;
    }
    throw new Error(res?.message || "Authentication failed");
  }, []);

  const logout = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("firm_user_logged_out", "true");
      sessionStorage.setItem("firm_user_logged_out", "true");
      localStorage.removeItem("firm_auth_token");
      localStorage.removeItem("token");
      try {
        const { App: CapacitorApp } = await import("@capacitor/app");
        const launchUrl = await CapacitorApp.getLaunchUrl();
        if (launchUrl?.url) {
          localStorage.setItem("firm_consumed_launch_url", launchUrl.url);
        }
      } catch {}
    }

    try {
      await authService.logout();
    } catch (e) {
      console.warn("Logout error:", e);
    }

    setUser(null);
    setFirm(null);
    setRole(null);
    setPermissions([]);
    setIsAuthenticated(false);

    try {
      router.replace("/login");
    } catch {}

    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  }, [router]);

  const hasPermission = useCallback(
    (permissionCode) => {
      if (user?.isSuperAdmin) return true;
      return permissions.includes(permissionCode);
    },
    [user, permissions]
  );

  const hasAnyPermission = useCallback(
    (codes) => {
      if (user?.isSuperAdmin) return true;
      return codes.some((code) => permissions.includes(code));
    },
    [user, permissions]
  );

  const value = {
    user,
    firm,
    role,
    permissions,
    loading,
    isAuthenticated,
    login,
    handleCallback,
    devLogin,
    logout,
    hasPermission,
    hasAnyPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * @returns {{
 *   user: import('@/types/auth.types').AuthUser | null,
 *   firm: import('@/types/firm.types').Firm | null,
 *   role: import('@/types/role.types').Role | null,
 *   permissions: string[],
 *   loading: boolean,
 *   isAuthenticated: boolean,
 *   login: () => void,
 *   handleCallback: (code: string) => Promise<any>,
 *   devLogin: () => void,
 *   logout: () => Promise<void>,
 *   hasPermission: (code: string) => boolean,
 *   hasAnyPermission: (codes: string[]) => boolean,
 * }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
