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
      redirectUri = `${origin}/callback`;
    }
  }

  return redirectUri;
}

/**
 * Build the Google OAuth 2.0 consent URL
 * @returns {string}
 */
export function getGoogleOAuthURL() {
  const redirectUri = getGoogleRedirectURI();

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Check if dev auth bypass is enabled
 * @returns {boolean}
 */
export function isDevAuthBypass() {
  return process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
}
