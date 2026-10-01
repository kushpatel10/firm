/**
 * Platform Detection & Environment Separation
 *
 * Strictly separates the Android Native Application (Capacitor shell)
 * from the Web Application (desktop and mobile web browsers).
 *
 * CRITICAL RULE:
 * A mobile browser (Chrome/Firefox/Safari) running on an Android phone
 * visiting the website is a WEB USER — NOT the Android native app.
 * Only the actual Capacitor Android native container running locally
 * is the Android Native Application.
 */

/**
 * Returns true ONLY when running inside the native Android Capacitor package.
 * In a standard web browser (desktop, tablet, or mobile phone), this returns false.
 * @returns {boolean}
 */
export function isAndroidNativeApp() {
  if (typeof window === "undefined") return false;

  // Purge any legacy emulation artifacts that may have been stored during previous testing
  try {
    if (localStorage.getItem("firm_emulate_platform")) {
      localStorage.removeItem("firm_emulate_platform");
    }
    if (sessionStorage.getItem("firm_emulate_platform")) {
      sessionStorage.removeItem("firm_emulate_platform");
    }
  } catch {}

  // 1. Native Capacitor custom scheme / protocol check
  if (window.location.protocol === "capacitor:") return true;

  // 2. Official Capacitor Runtime check
  try {
    if (
      typeof window.Capacitor !== "undefined" &&
      typeof window.Capacitor.isNativePlatform === "function"
    ) {
      if (
        window.Capacitor.isNativePlatform() &&
        window.Capacitor.getPlatform() === "android"
      ) {
        return true;
      }
    }
  } catch {}

  // 3. Build-time Capacitor flag (strictly true only when building Android Capacitor APK via npm run cap:build)
  if (process.env.NEXT_PUBLIC_IS_CAPACITOR_BUILD === "true") {
    return true;
  }

  // Regular web browsers (desktop, tablet, or mobile phone visiting the website) are ALWAYS Web!
  return false;
}

/**
 * Returns true if running in a web browser environment.
 * @returns {boolean}
 */
export function isWebApp() {
  return !isAndroidNativeApp();
}
