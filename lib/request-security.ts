type WindowEntry = { count: number; resetsAt: number };
const windows = new Map<string, WindowEntry>();
const submissions = new Map<string, number>();

export function requestClientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "local";
}

export function consumeFixedWindow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  let entry = windows.get(key);
  if (!entry || entry.resetsAt <= now) entry = { count: 0, resetsAt: now + windowMs };
  entry.count += 1;
  windows.set(key, entry);
  return { allowed: entry.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetsAt - now) / 1000)) };
}

export function isRecentDuplicate(key: string, ttlMs: number) {
  const recordedAt = submissions.get(key);
  if (!recordedAt) return false;
  if (Date.now() - recordedAt >= ttlMs) { submissions.delete(key); return false; }
  return true;
}

export function recordSubmission(key: string) {
  submissions.set(key, Date.now());
}
