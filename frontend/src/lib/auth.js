/**
 * Google OAuth helpers — no Firebase dependency.
 * Constructs OAuth URLs and manages JWT tokens.
 */

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_REDIRECT_URI =
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || "http://localhost:3000/callback";

/**
 * Build the Google OAuth 2.0 consent URL
 * @returns {string}
 */
export function getGoogleOAuthURL() {
  let redirectUri = GOOGLE_REDIRECT_URI;
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // If accessed through HTTPS domain, Cloudflare tunnel, or reverse proxy, route to same-origin /callback
    if (
      origin &&
      !origin.includes("capacitor:") &&
      !origin.includes("localhost") &&
      !origin.includes("127.0.0.1") &&
      (window.location.protocol === "https:" || origin.includes("cloudflare") || origin.includes("trycloudflare.com"))
    ) {
      redirectUri = `${origin}/callback`;
    }
  }

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
