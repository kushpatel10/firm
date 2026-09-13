"use client";

import { useEffect } from "react";

/**
 * Ensures safe-area insets are properly applied on mobile devices,
 * especially inside Capacitor WebView on Android/iOS where env()
 * might not be populated immediately or on older Android system WebViews.
 */
export function SafeAreaProvider({ children }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const applySafeAreas = () => {
      const isCapacitor =
        window.Capacitor?.isNativePlatform?.() ||
        (window.location.hostname === "localhost" &&
          /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

      const isAndroid =
        /Android/i.test(navigator.userAgent) ||
        window.Capacitor?.getPlatform?.() === "android";
      if (isAndroid) {
        document.documentElement.classList.add("platform-android");
      }

      if (isCapacitor) {
        const style = getComputedStyle(document.documentElement);
        const injectedTop = style.getPropertyValue("--safe-area-inset-top");
        const topPx = parseInt(injectedTop || "0", 10);

        if (topPx <= 0) {
          const defaultBottom = isAndroid ? "16px" : "24px";
          document.documentElement.style.setProperty("--safe-area-fallback-bottom", defaultBottom);
        }
      }
    };

    applySafeAreas();
    window.addEventListener("resize", applySafeAreas);
    window.addEventListener("orientationchange", applySafeAreas);
    return () => {
      window.removeEventListener("resize", applySafeAreas);
      window.removeEventListener("orientationchange", applySafeAreas);
    };
  }, []);

  return children;
}
