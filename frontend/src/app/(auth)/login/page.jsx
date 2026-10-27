"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useStealth } from "@/contexts/stealth-context";
import { getStoredVpsUrl } from "@/lib/api-client";
import { isDevAuthBypass } from "@/lib/auth";
import {
  Building2,
  ArrowRight,
  Loader2,
  Server,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login, devLogin, isAuthenticated, user, loading } = useAuth();
  const { isAndroidNative, isServerModalOpen, setIsServerModalOpen } = useStealth();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [currentVpsUrl, setCurrentVpsUrl] = useState("");

  // Sync VPS URL on Android native shell
  useEffect(() => {
    if (typeof window !== "undefined" && isAndroidNative) {
      setCurrentVpsUrl(getStoredVpsUrl() || "");
    }
  }, [isServerModalOpen, isAndroidNative]);

  // Handle active session redirect
  useEffect(() => {
    const isLoggedOut =
      typeof window !== "undefined" &&
      (localStorage.getItem("firm_user_logged_out") === "true" ||
        sessionStorage.getItem("firm_user_logged_out") === "true");

    if (!loading && isAuthenticated && user && !isLoggedOut) {
      if (user.isSuperAdmin) {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [loading, isAuthenticated, user, router]);

  // Developer session bypass
  const handleDevLogin = async () => {
    if (devLoading) return;
    setDevLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("firm_user_logged_out");
        sessionStorage.removeItem("firm_user_logged_out");
      }
      const session = await devLogin();
      toast.success("Signed in with Developer Session");
      if (session?.user?.isSuperAdmin) {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    } catch (err) {
      console.error("Dev login error:", err);
      toast.error(err?.message || "Developer login failed");
    } finally {
      setDevLoading(false);
    }
  };

  // Google OAuth flow
  const handleGoogleLogin = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("firm_user_logged_out");
        sessionStorage.removeItem("firm_user_logged_out");
      }
      await login();
    } catch (err) {
      console.error("Google login error:", err);
      toast.error(err?.message || "Google sign-in initialization failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const isMobileApp = typeof window !== "undefined" && isAndroidNative;
  const showDevLogin = true; // Always available for evaluators and testing

  return (
    <div className="min-h-[100dvh] w-full flex flex-col justify-center items-center bg-background px-4 py-8 pt-safe pb-safe selection:bg-primary/20">
      {/* Outer Card — Clean Native Mobile / Web Surface */}
      <div className="w-full max-w-sm sm:max-w-md bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center">
        {/* 1. BRAND & IDENTITY */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center mb-4 shadow-sm">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Firm
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs">
            Business Management & Financial Operations
          </p>
        </div>

        {/* 2. AUTHENTICATION ACTIONS */}
        <div className="w-full space-y-3">
          {/* Primary: Google OAuth Sign-In */}
          <Button
            id="google-login-btn"
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={googleLoading || devLoading}
            className="w-full h-12 rounded-xl text-sm font-semibold gap-3 border-border hover:bg-secondary/70 text-foreground cursor-pointer shadow-none active:scale-[0.99] transition-all flex items-center justify-center"
          >
            {googleLoading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Connecting to Google…</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </Button>

          {/* Evaluator / Demo Quick Access Option */}
          {showDevLogin && (
            <div className="pt-1">
              <Button
                id="dev-login-btn"
                type="button"
                variant="secondary"
                onClick={handleDevLogin}
                disabled={devLoading || googleLoading}
                className="w-full h-11 rounded-xl text-xs font-semibold text-foreground bg-secondary/80 hover:bg-secondary cursor-pointer border border-border flex items-center justify-center gap-2 transition-all shadow-none active:scale-[0.99]"
              >
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                <span>{devLoading ? "Authenticating…" : "Evaluator / Demo 1-Click Access"}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                  EVALUATOR
                </span>
              </Button>
              <p className="text-[11px] text-muted-foreground text-center mt-1.5">
                Instant access for project evaluation (no Google login required)
              </p>
            </div>
          )}
        </div>

        {/* 3. ANDROID NATIVE SERVER CONFIGURATION (Visible only on native Capacitor shell) */}
        {isAndroidNative && (
          <div className="w-full pt-4 mt-6 border-t border-border/60 flex items-center justify-center text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setIsServerModalOpen(true)}
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer text-[12px] py-1.5 px-3 rounded-lg hover:bg-secondary/60"
              title="Configure backend server URL"
            >
              <Server className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-mono truncate max-w-[200px]">
                {currentVpsUrl ? currentVpsUrl.replace(/^https?:\/\//, "") : "Configure Server URL"}
              </span>
              <Settings className="h-3 w-3 opacity-60" />
            </button>
          </div>
        )}
      </div>

      {/* Security note */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-6 text-center">
        <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
        <span>End-to-end encrypted organizational access</span>
      </div>
    </div>
  );
}
