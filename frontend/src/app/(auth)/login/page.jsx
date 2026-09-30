"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useStealth } from "@/contexts/stealth-context";
import { getStoredVpsUrl } from "@/lib/api-client";
import { isDevAuthBypass } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Building2, Shield, ArrowRight, Server, Lock, Settings, Calculator as CalculatorIcon } from "lucide-react";
import { CalculatorVault } from "@/components/decoy/calculator-vault";
import { ServerConfigModal } from "@/components/decoy/server-config-modal";
import { toast } from "sonner";

export default function LoginPage() {
  const { login, devLogin, isAuthenticated, user, firm, loading } = useAuth();
  const {
    isStealthEnabled,
    isUnlocked,
    isInitialized,
    lock,
    isServerModalOpen,
    setIsServerModalOpen,
    isAndroidNative,
  } = useStealth();
  const router = useRouter();
  const [devLoading, setDevLoading] = useState(false);
  const [currentVpsUrl, setCurrentVpsUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentVpsUrl(getStoredVpsUrl() || "");
    }
  }, [isServerModalOpen]);

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
  }, [loading, isAuthenticated, user, firm, router]);

  const isExplicitlyLoggedOut =
    typeof window !== "undefined" &&
    (localStorage.getItem("firm_user_logged_out") === "true" ||
      sessionStorage.getItem("firm_user_logged_out") === "true");

  if (isInitialized && isStealthEnabled && !isUnlocked) {
    return <CalculatorVault />;
  }

  if (!loading && isAuthenticated && user && !isExplicitlyLoggedOut) {
    return null;
  }

  const handleDevLogin = async () => {
    setDevLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("firm_user_logged_out");
        sessionStorage.removeItem("firm_user_logged_out");
      }
      const session = await devLogin();
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

  const handleGoogleLogin = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("firm_user_logged_out");
        sessionStorage.removeItem("firm_user_logged_out");
      }
      await login();
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err?.message || "Google sign-in initialization failed");
    }
  };

  const isMobileApp = typeof window !== "undefined" && (!!window.Capacitor || window.location.protocol === "capacitor:");
  const showDevLogin = isDevAuthBypass() || process.env.NODE_ENV !== "production" || isMobileApp;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — Clean Monochrome Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 text-zinc-100 border-r border-zinc-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-zinc-100" />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-white">Firm</span>
            <span className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400">Enterprise Platform</span>
          </div>
        </div>

        <div className="space-y-6 max-w-md my-auto">
          <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-mono text-zinc-300">
            <span>Multi-Tenant Architecture</span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            Precision enterprise operations and cryptographic ledger.
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Multi-branch billing, hardware-backed vault security, real-time inventory reconciliation, and financial reporting.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
              <Shield className="h-4 w-4 mb-2 text-zinc-300" />
              <p className="text-xs font-medium text-zinc-200">Encrypted Vault</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">RSA-2048 hybrid RAM security</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
              <Building2 className="h-4 w-4 mb-2 text-zinc-300" />
              <p className="text-xs font-medium text-zinc-200">Multi-Tenant</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Strict database tenant isolation</p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-zinc-500 font-mono">
          © {new Date().getFullYear()} Firm Inc. All rights reserved.
        </p>
      </div>

      {/* Right — Minimal Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-4">
            <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-semibold">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Firm</span>
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Sign in</h2>
            <p className="text-xs text-muted-foreground">
              Authenticate using your authorized organizational identity
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              className="w-full h-10 text-xs font-medium gap-2.5 rounded-lg shadow-none cursor-pointer"
              onClick={handleGoogleLogin}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
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
            </Button>

            {showDevLogin && (
              <>
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/70" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-mono">
                    <span className="bg-background px-2 text-muted-foreground">
                      Development Mode
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-10 gap-2 rounded-lg text-xs font-medium border-border/80 hover:bg-muted/50 cursor-pointer shadow-none"
                  onClick={handleDevLogin}
                  disabled={devLoading}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>{devLoading ? "Authenticating…" : "Developer Session Bypass"}</span>
                </Button>
              </>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground leading-normal text-center sm:text-left pt-2">
            By signing in, you agree to system security policies and authorized audit procedures.
          </p>

          {isAndroidNative && (
            <>
              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setIsServerModalOpen(true)}
                  className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer text-[11px]"
                  title="Click to configure VPS or server URL"
                >
                  <Server className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-mono max-w-[170px] truncate">
                    {currentVpsUrl ? currentVpsUrl.replace(/^https?:\/\//, "") : "Configure VPS"}
                  </span>
                  <Settings className="h-3 w-3 opacity-60" />
                </button>

                <button
                  type="button"
                  onClick={lock}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer"
                  title="Lock and switch back to Calculator vault"
                >
                  <Lock className="h-3 w-3" />
                  <span>Lock Vault</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
