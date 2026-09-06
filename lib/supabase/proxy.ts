import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAuthFetch } from "@/lib/supabase/fetch";
import { isSessionExpiredError, safeAdminDestination } from "@/lib/auth-errors";

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    global: { fetch: supabaseAuthFetch },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin");
  const hasSessionCookie = request.cookies.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
  if (isAdminPage && !hasSessionCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", safeAdminDestination(`${request.nextUrl.pathname}${request.nextUrl.search}`));
    return NextResponse.redirect(loginUrl);
  }
  try {
    const { data, error } = await supabase.auth.getClaims();
    if (isAdminPage && (!data?.claims.sub || isSessionExpiredError(error))) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("next", safeAdminDestination(`${request.nextUrl.pathname}${request.nextUrl.search}`));
      return NextResponse.redirect(loginUrl);
    }
  } catch { /* Network failures are rendered as service errors by the protected DAL. */ }
  return response;
}
