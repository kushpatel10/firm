"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleCallback } = useAuth();
  const [returnToken, setReturnToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
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

      try {
        const session = await handleCallback(code);
        const token = session?.token || localStorage.getItem("firm_auth_token") || "dev-token";
        setReturnToken(token);

        const targetRoute = session?.user?.isSuperAdmin
          ? "/admin"
          : "/dashboard";

        // Deep link back into native Android/iOS app ONLY if inside native Capacitor shell
        if (typeof window !== "undefined") {
          let isNative = false;
          try {
            const { Capacitor } = require("@capacitor/core");
            isNative = typeof Capacitor?.isNativePlatform === "function" && Capacitor.isNativePlatform();
          } catch {}

          const isCapacitorShell = isNative || window.location.protocol === "capacitor:";
          if (isCapacitorShell) {
            window.location.href = `com.bcalc.app://callback?token=${encodeURIComponent(token)}`;
            return;
          }
        }

        router.replace(targetRoute);
      } catch (err) {
        console.error("Authentication callback error:", err);
        setErrorMessage(err?.message || "Authentication failed");
        router.replace("/access-denied");
      }
    }

    processCallback();
  }, [searchParams, router, handleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground font-medium">Signing you in…</p>
        {returnToken && (
          <div className="pt-2">
            <a
              href={`com.bcalc.app://callback?token=${encodeURIComponent(returnToken)}`}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Return to Firm App
            </a>
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading…</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
