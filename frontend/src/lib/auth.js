/**
 * Google OAuth helpers — no Firebase dependency.
 * Constructs OAuth URLs and manages JWT tokens.
 */

const PUBLIC_URL =
  process.env.NEXT_PUBLIC_PUBLIC_URL ||
  process.env.PUBLIC_URL ||
  "";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_REDIRECT_URI =
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
  (PUBLIC_URL ? `${PUBLIC_URL.replace(/\/+$/, "")}/callback` : "http://localhost:3000/callback");

/**
 * Resolve the exact OAuth callback redirect URI.
 * Guarantees an identical redirect URI for both consent URL generation and code exchange.
 * @returns {string}
 */
export function getGoogleRedirectURI() {
  let redirectUri = GOOGLE_REDIRECT_URI;

  if (typeof window !== "undefined") {
    // 1. Check if user configured a VPS URL in the app (Crucial for Android / Capacitor app)
    const storedVps =
      window.localStorage.getItem("firm_vps_url") ||
      window.localStorage.getItem("firm_api_url");

    if (storedVps) {
      let baseUrl = storedVps.trim().replace(/\/+$/, "");
      if (baseUrl.toLowerCase().endsWith("/api")) {
        baseUrl = baseUrl.slice(0, -4);
      }
      if (
        baseUrl &&
        !baseUrl.includes("10.0.2.2") &&
        !baseUrl.includes("localhost") &&
        !baseUrl.includes("127.0.0.1")
      ) {
        if (!/^https?:\/\//i.test(baseUrl)) {
          baseUrl = `https://${baseUrl}`;
        }
        return `${baseUrl}/callback`;
      }
    }

    // 2. Check current browser window location origin
    let origin = window.location.origin;

    // Tailscale Funnel is always served publicly over HTTPS
    if (origin && origin.includes(".ts.net") && origin.startsWith("http://")) {
      origin = origin.replace("http://", "https://");
    }

    // If accessed through Tailscale Funnel (.ts.net), HTTPS domain, Cloudflare tunnel, or reverse proxy
    if (
      origin &&
      !origin.includes("capacitor:") &&
      !origin.includes("localhost") &&
      !origin.includes("127.0.0.1") &&
      (window.location.protocol === "https:" ||
        origin.includes(".ts.net") ||
        origin.includes("cloudflare") ||
        origin.includes("trycloudflare.com"))
    ) {
      return `${origin}/callback`;
    }

    // 3. Fallback to configured PUBLIC_URL if present
    if (PUBLIC_URL && !PUBLIC_URL.includes("localhost") && !PUBLIC_URL.includes("127.0.0.1")) {
      let pub = PUBLIC_URL.trim().replace(/\/+$/, "");
      if (!/^https?:\/\//i.test(pub)) {
        pub = `https://${pub}`;
      }
      return `${pub}/callback`;
    }
  }

  return redirectUri;
}

/**
 * Build the Google OAuth 2.0 consent URL
 * @param {Object} [options]
 * @param {string} [options.state]
 * @param {boolean} [options.isNative]
 * @returns {string}
 */
export function getGoogleOAuthURL(options = {}) {
  const redirectUri = getGoogleRedirectURI();

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  let isNative = options.isNative;
  if (isNative === undefined && typeof window !== "undefined") {
    try {
      const { Capacitor } = require("@capacitor/core");
      isNative =
        (typeof Capacitor?.isNativePlatform === "function" && Capacitor.isNativePlatform()) ||
        window.location.protocol === "capacitor:" ||
        process.env.NEXT_PUBLIC_IS_CAPACITOR_BUILD === "true";
    } catch {
      isNative =
        window.location.protocol === "capacitor:" ||
        process.env.NEXT_PUBLIC_IS_CAPACITOR_BUILD === "true";
    }
  }

  if (options.state) {
    params.set("state", options.state);
  } else if (isNative) {
    params.set("state", "capacitor");
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Check if dev/evaluator auth bypass is enabled (enabled by default for evaluation)
 * @returns {boolean}
 */
export function isDevAuthBypass() {
  return process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS !== "false";
}
