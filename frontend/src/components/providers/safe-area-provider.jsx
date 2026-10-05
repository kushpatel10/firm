"use client";

import { useEffect } from "react";

/**
 * Ensures safe-area insets are properly applied on mobile devices,
 * especially inside Capacitor WebView on Android/iOS.
 * Also syncs system status bar overlay and theme-matching icons (dark/light).
 */
export function SafeAreaProvider({ children }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isAndroid =
      /Android/i.test(navigator.userAgent) ||
      window.Capacitor?.getPlatform?.() === "android";

    if (isAndroid) {
      document.documentElement.classList.add("platform-android");
    }

    const isCapacitor =
      typeof window.Capacitor?.isNativePlatform === "function"
        ? window.Capacitor.isNativePlatform()
        : window.location.protocol === "capacitor:";

    // Sync status bar icons with current theme (light vs dark mode)
    const syncStatusBarWithTheme = async () => {
      if (!isCapacitor) return;
      try {
        const isDark = document.documentElement.classList.contains("dark");
        const style = isDark ? "DARK" : "LIGHT";

        // Capacitor runtime plugin (injected by native Android/iOS bridge)
        const statusBar =
          window.Capacitor?.Plugins?.StatusBar ||
          window.Capacitor?.registerPlugin?.("StatusBar");

        if (statusBar) {
          await statusBar.setOverlaysWebView?.({ overlay: true });
          await statusBar.setStyle?.({ style });
        }
      } catch {
        // Ignored if plugin not loaded or non-native
      }
    };

    syncStatusBarWithTheme();

    // Observe theme class changes on <html>
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "class") {
          syncStatusBarWithTheme();
          break;
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const applySafeAreas = () => {
      if (isCapacitor) {
        const style = getComputedStyle(document.documentElement);
        const injectedTop = style.getPropertyValue("--safe-area-inset-top");
        const topPx = parseInt(injectedTop || "0", 10);

        if (topPx <= 0) {
          const defaultTop = isAndroid ? "28px" : "44px";
          const defaultBottom = isAndroid ? "16px" : "24px";
          document.documentElement.style.setProperty("--safe-area-fallback-top", defaultTop);
          document.documentElement.style.setProperty("--safe-area-fallback-bottom", defaultBottom);
        }
      }
    };

    applySafeAreas();
    window.addEventListener("resize", applySafeAreas);
    window.addEventListener("orientationchange", applySafeAreas);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", applySafeAreas);
      window.removeEventListener("orientationchange", applySafeAreas);
    };
  }, []);

  return children;
}

