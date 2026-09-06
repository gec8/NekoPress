import "server-only";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 5;
const attempts = new Map<string, { count: number; resetsAt: number }>();

function current(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetsAt <= now) {
    const fresh = { count: 0, resetsAt: now + WINDOW_MS };
    attempts.set(key, fresh);
    return fresh;
  }
  return entry;
}

export function checkLoginLimit(key: string) {
  const entry = current(key);
  return { allowed: entry.count < MAX_FAILURES, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetsAt - Date.now()) / 1000)) };
}

export function recordLoginFailure(key: string) {
  const entry = current(key);
  entry.count += 1;
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
