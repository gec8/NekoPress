import { NextResponse } from "next/server";
import { getAdminMedia } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getAdminMedia();
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ items: result.data }, { headers: { "cache-control": "no-store" } });
}
