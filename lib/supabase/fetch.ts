const SUPABASE_TIMEOUT_MS = 5000;
const SUPABASE_AUTH_TIMEOUT_MS = 8000;
const SUPABASE_COOLDOWN_MS = 10000;
let unavailableUntil = 0;

export const supabaseFetch: typeof fetch = async (input, init) => {
  if (Date.now() < unavailableUntil) throw new TypeError("Supabase temporarily unavailable");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
  const sourceSignal = init?.signal;
  const abortFromSource = () => controller.abort(sourceSignal?.reason);
  sourceSignal?.addEventListener("abort", abortFromSource, { once: true });
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    unavailableUntil = 0;
    return response;
  } catch (error) {
    unavailableUntil = Date.now() + SUPABASE_COOLDOWN_MS;
    throw error;
  } finally {
    clearTimeout(timer);
    sourceSignal?.removeEventListener("abort", abortFromSource);
  }
};

// Authentication must not inherit the content API cooldown. Otherwise one
// failed image or article request can make a valid session look logged out.
export const supabaseAuthFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_AUTH_TIMEOUT_MS);
  const sourceSignal = init?.signal;
  const abortFromSource = () => controller.abort(sourceSignal?.reason);
  sourceSignal?.addEventListener("abort", abortFromSource, { once: true });
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    sourceSignal?.removeEventListener("abort", abortFromSource);
  }
};
