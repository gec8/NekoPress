import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { createServerClientSafe } from "@/lib/supabase/server";
import { supabaseFetch } from "@/lib/supabase/fetch";
import { isSessionExpiredError } from "@/lib/auth-errors";

export const requireAdmin = cache(async function requireAdmin() {
  const sessionClient = await createServerClientSafe();
  if (!sessionClient) return { error: "Supabase 未配置", status: 503 as const, kind: "configuration" as const };
  let authResult;
  try { authResult = await sessionClient.auth.getClaims(); }
  catch { return { error: "登录服务暂时无法连接", status: 503 as const, kind: "network" as const }; }
  const { data: authData, error: authError } = authResult;
  const userId = authData?.claims.sub;
  if (authError) return isSessionExpiredError(authError)
    ? { error: "登录已过期", status: 401 as const, kind: "session" as const }
    : { error: "登录服务暂时无法连接", status: 503 as const, kind: "network" as const };
  if (!userId) return { error: "登录已过期", status: 401 as const, kind: "session" as const };
  let profileResult;
  try { profileResult = await sessionClient.from("profiles").select("role").eq("id", userId).maybeSingle(); }
  catch { return { error: "数据库暂时无法连接", status: 503 as const, kind: "database" as const }; }
  const { data: profile, error: profileError } = profileResult;
  if (profileError) return { error: "数据库暂时无法连接", status: 503 as const, kind: "database" as const };
  if (!profile || !["admin", "editor"].includes(String(profile.role))) return { error: "无后台权限", status: 403 as const, kind: "permission" as const };
  const role = profile.role === "admin" ? "admin" as const : "editor" as const;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) return { error: "缺少 Supabase 服务端密钥", status: 503 as const, kind: "configuration" as const };
  return {
    admin: createSupabaseClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: supabaseFetch },
    }),
    userId,
    email: typeof authData.claims.email === "string" ? authData.claims.email : "管理员",
    role,
  };
});
