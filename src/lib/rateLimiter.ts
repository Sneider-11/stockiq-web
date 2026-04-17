/**
 * In-memory rate limiter for login attempts.
 *
 * Tracks failed attempts per key (IP address or cédula) using a sliding
 * window. Designed for Next.js serverless: each function instance has its
 * own Map, which is fine — a distributed attacker hitting different instances
 * gets MAX_ATTEMPTS retries per instance, still stopping automated scripts.
 *
 * MAX_ATTEMPTS = 5 failures before a 15-minute lockout.
 */

const MAX_ATTEMPTS  = 5;
const WINDOW_MS     = 15 * 60 * 1000; // 15 minutes

interface Entry {
  count:     number;
  expiresAt: number; // epoch ms when the lockout lifts
}

const store = new Map<string, Entry>();

/** Call on every failed login attempt. Returns true if the key is now rate-limited. */
export function recordFailedAttempt(key: string): boolean {
  const now  = Date.now();
  const prev = store.get(key);

  if (!prev || prev.expiresAt < now) {
    // Fresh window
    store.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return false;
  }

  const updated = { count: prev.count + 1, expiresAt: prev.expiresAt };
  store.set(key, updated);
  return updated.count >= MAX_ATTEMPTS;
}

/** Call after a successful login to clear the counter. */
export function clearAttempts(key: string): void {
  store.delete(key);
}

/** Returns seconds remaining in the lockout (0 if not locked). */
export function secondsUntilUnlock(key: string): number {
  const now   = Date.now();
  const entry = store.get(key);
  if (!entry || entry.count < MAX_ATTEMPTS || entry.expiresAt < now) return 0;
  return Math.ceil((entry.expiresAt - now) / 1000);
}
