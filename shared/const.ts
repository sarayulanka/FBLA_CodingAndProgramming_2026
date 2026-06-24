/**
 * shared/const.ts — Constants shared between client and server.
 *
 * Keeping these in one place ensures both sides use the same
 * cookie name, error messages, and timeout values.
 */

/** Name of the HTTP cookie that stores the user's session ID */
export const COOKIE_NAME = "app_session_id";

/** One year in milliseconds — used for cookie expiration */
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

/** Default timeout for outbound HTTP requests (30 seconds) */
export const AXIOS_TIMEOUT_MS = 30_000;

/** Standard error message returned when a user is not authenticated */
export const UNAUTHED_ERR_MSG = 'Please login (10001)';

/** Standard error message returned when a non-admin tries an admin action */
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
