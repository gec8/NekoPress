import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseFetch } from "@/lib/supabase/fetch";

/** Public, anonymous client for cacheable content reads. Never reads cookies. */
export function createPublicClientSafe() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: supabaseFetch },
  });
}
