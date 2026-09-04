import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAuthFetch } from "@/lib/supabase/fetch";

export async function createServerClientSafe() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    global: { fetch: supabaseAuthFetch },
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Server Components may not write cookies. */ }
      },
    },
  });
}
