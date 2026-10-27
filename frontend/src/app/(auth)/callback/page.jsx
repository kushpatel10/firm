"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { backupService } from "@/services/backup.service";
import { Loader2, Smartphone, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function isNativeShell() {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = require("@capacitor/core");
    return (
      (typeof Capacitor?.isNativePlatform === "function" && Capacitor.isNativePlatform()) ||
      window.location.protocol === "capacitor:" ||
      process.env.NEXT_PUBLIC_IS_CAPACITOR_BUILD === "true"
    );
  } catch {
    return (
      window.location.protocol === "capacitor:" ||
      process.env.NEXT_PUBLIC_IS_CAPACITOR_BUILD === "true"
    );
  }
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleCallback } = useAuth();

  const [returnToken, setReturnToken] = useState(null);
  const [targetRoute, setTargetRoute] = useState("/dashboard");
  const [status, setStatus] = useState("exchanging"); // "exchanging" | "native_redirect" | "web_redirect" | "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [isExplicitApp, setIsExplicitApp] = useState(false);
  const processedRef = useRef(false);

  useEffect(() => {
    async function processCallback() {
      const code = searchParams.get("code");
      if (!code) {
        router.replace("/login");
        return;
      }

      if (processedRef.current) return;
      processedRef.current = true;

      // Handle Google Drive backup linkage
      const rawState = searchParams.get("state");
      let parsedBackupState = null;
      try {
        parsedBackupState = rawState ? JSON.parse(rawState) : null;
      } catch {}

      if (parsedBackupState?.firmId) {
        setStatus("exchanging");
        try {
          await backupService.handleGoogleCallback(parsedBackupState.firmId, code);
          const target = parsedBackupState.returnUrl || "/dashboard/settings?tab=backups";
          router.replace(target);
          return;
        } catch (backupErr) {
          console.error("Failed to link Google Drive:", backupErr);
          setErrorMessage(backupErr.message || "Failed to link Google Drive");
          setStatus("error");
          return;
        }
      }

      try {
        const session = await handleCallback(code);
        const token = session?.token || localStorage.getItem("firm_auth_token") || "dev-token";
        setReturnToken(token);

        const route = session?.user?.isSuperAdmin ? "/admin" : "/dashboard";
        setTargetRoute(route);

        const stateParam = (searchParams.get("state") || "").toLowerCase();
        const sourceParam = (searchParams.get("source") || "").toLowerCase();
        const nativeParam = searchParams.get("native");

        const isNative = isNativeShell();
        const isUserAgentMobile =
          typeof navigator !== "undefined" &&
          /android|iphone|ipad|ipod/i.test(navigator.userAgent);

        const explicitApp =
          stateParam === "capacitor" ||
          stateParam === "app" ||
          stateParam === "native_app" ||
          sourceParam === "app" ||
          nativeParam === "1" ||
          isNative;

        setIsExplicitApp(explicitApp);

        // Treat as native app flow if explicitly launched from app OR on mobile device
        const isNativeFlow = explicitApp || isUserAgentMobile;

        if (isNativeFlow) {
          setStatus("native_redirect");
          const deepLink = `com.bcalc.app://callback?token=${encodeURIComponent(token)}`;

          if (typeof window !== "undefined") {
            // 1. Immediate custom scheme redirection
            try {
              window.location.href = deepLink;
            } catch (err) {
              console.warn("Direct deep link invocation failed:", err);
            }

            // 2. Programmatic click fallback after brief tick for maximum mobile browser compatibility
            const timer = setTimeout(() => {
              try {
                const a = document.createElement("a");
                a.href = deepLink;
                a.rel = "noreferrer";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              } catch {}
            }, 300);

            return () => clearTimeout(timer);
          }
          return;
        }

        // Web (Desktop PC) flow: smoothly redirect directly to dashboard / admin
        setStatus("web_redirect");
        router.replace(route);
      } catch (err) {
        console.error("Authentication callback error:", err);
        setErrorMessage(err?.message || "Authentication failed");
        setStatus("error");
      }
    }

    processCallback();
  }, [searchParams, router, handleCallback]);

  const deepLinkUrl = returnToken
    ? `com.bcalc.app://callback?token=${encodeURIComponent(returnToken)}`
    : "";

  return (
    <div className="min-h-[100dvh] w-full flex flex-col justify-center items-center bg-background px-4 py-8 selection:bg-primary/20">
      <div className="w-full max-w-sm sm:max-w-md bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center">
        {status === "exchanging" && (
          <div className="space-y-4 py-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Signing you in…</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Verifying your Google authentication credentials
              </p>
            </div>
          </div>
        )}

        {status === "web_redirect" && (
          <div className="space-y-4 py-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Redirecting to Dashboard…</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Preparing your business workspace
              </p>
            </div>
          </div>
        )}

        {status === "native_redirect" && (
          <div className="w-full space-y-5 py-3 flex flex-col items-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Returning to Firm App
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
                You are signed in! Opening the Firm mobile application on your device…
              </p>
            </div>

            {returnToken && (
              <div className="w-full pt-2 space-y-3">
                <a
                  id="return-to-firm-app-btn"
                  href={deepLinkUrl}
                  onClick={() => {
                    try {
                      window.location.href = deepLinkUrl;
                    } catch {}
                  }}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.99] gap-2.5 cursor-pointer"
                >
                  <Smartphone className="h-5 w-5 shrink-0" />
                  <span>Return to Firm App</span>
                </a>

                <p className="text-[11px] text-muted-foreground px-2">
                  If the app didn&apos;t open automatically, tap the button above to switch back.
                </p>

                {!isExplicitApp && (
                  <div className="pt-2 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => router.replace(targetRoute)}
                      className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer transition-colors"
                    >
                      Or continue in web browser
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-4 flex flex-col items-center">
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Authentication Failed</h2>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {errorMessage || "We were unable to complete your sign-in request."}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.replace("/login")}
              className="mt-2 text-xs rounded-xl"
            >
              Return to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground text-sm font-medium">Loading…</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
