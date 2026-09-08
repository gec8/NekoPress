export function isSessionExpiredError(error: unknown) {
  if (!error) return false;
  const candidate = error as { code?: unknown; name?: unknown; message?: unknown; status?: unknown };
  const text = `${String(candidate.code ?? "")} ${String(candidate.name ?? "")} ${String(candidate.message ?? "")}`.toLowerCase();
  return candidate.status === 401 || [
    "auth session missing",
    "session_not_found",
    "refresh_token_not_found",
    "invalid refresh token",
    "jwt expired",
  ].some((value) => text.includes(value));
}

export function isAuthNetworkError(error:unknown){
  if(!error)return false;
  const candidate=error as {name?:unknown;message?:unknown;status?:unknown};
  const text=`${String(candidate.name??"")} ${String(candidate.message??"")}`.toLowerCase();
  return candidate.status===0||text.includes("authretryablefetcherror")||text.includes("fetch failed")||text.includes("network request failed");
}

export function safeAdminDestination(value: string | null | undefined) {
  if (!value || value.startsWith("//") || !(value === "/admin" || value.startsWith("/admin/") || value.startsWith("/admin?"))) return "/admin";
  return value;
}
