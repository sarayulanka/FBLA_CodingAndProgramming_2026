/**
 * Simple in-memory rate limiter for bot prevention.
 * Tracks actions per user per time window.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now - entry.windowStart > 120_000) {
      store.delete(key);
    }
  });
}, 300_000);

/**
 * Check if an action is rate limited.
 * @returns true if the action is allowed, false if rate limited.
 */
export function checkRateLimit(
  userId: number,
  action: string,
  maxPerWindow: number,
  windowMs: number = 60_000
): boolean {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= maxPerWindow) {
    return false;
  }

  entry.count++;
  return true;
}
