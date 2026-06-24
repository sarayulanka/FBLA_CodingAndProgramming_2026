/**
 * const.ts — Client-side constants and helpers.
 *
 * Re-exports shared constants used across the frontend, plus
 * provides the runtime OAuth login URL builder.
 */

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Application display title (configurable via environment variable)
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

// Placeholder logo used when no custom logo is supplied
export const APP_LOGO = "https://placehold.co/128x128/3B82F6/FFFFFF?text=BB";

/**
 * Builds the OAuth sign-in URL at runtime so the redirect URI always
 * matches the current window origin (works on localhost and production).
 */
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // The state parameter carries the redirect URI (base64-encoded) so the
  // OAuth callback knows where to send the user after authentication.
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
