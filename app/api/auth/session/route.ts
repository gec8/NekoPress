import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ ok: false, error: auth.error, kind: auth.kind }, { status: auth.status, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ ok: true, role: auth.role }, { headers: { "Cache-Control": "no-store" } });
}
