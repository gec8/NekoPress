import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json(
      { ok:false, kind:auth.kind, message:auth.error, latencyMs:Date.now()-startedAt },
      { status:auth.status, headers:{ "Cache-Control":"no-store" } },
    );
  }
  const { error } = await auth.admin.from("site_settings").select("id").limit(1);
  if (error) {
    return NextResponse.json(
      { ok:false, kind:"database", message:"数据库读取异常", latencyMs:Date.now()-startedAt },
      { status:503, headers:{ "Cache-Control":"no-store" } },
    );
  }
  return NextResponse.json(
    { ok:true, kind:"healthy", message:"后台服务正常", latencyMs:Date.now()-startedAt, checkedAt:new Date().toISOString() },
    { headers:{ "Cache-Control":"no-store" } },
  );
}
