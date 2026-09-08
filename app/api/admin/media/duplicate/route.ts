import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getMediaKind } from "@/lib/media-types";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const hash = new URL(request.url).searchParams.get("hash") ?? "";
  if (!/^[a-f0-9]{64}$/.test(hash)) return NextResponse.json({ error: "文件指纹无效" }, { status: 400 });
  const { data, error } = await auth.admin.from("media_assets").select("path,public_url,original_name,mime_type,size_bytes,created_at,width,height").eq("content_hash", hash).eq("status", "ready").limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: "重复文件检测暂时不可用" }, { status: 503 });
  if (!data) return NextResponse.json({ duplicate: false });
  return NextResponse.json({ duplicate: true, item: { path:data.path,url:data.public_url,name:data.original_name,mime:data.mime_type,size:Number(data.size_bytes),createdAt:data.created_at,width:data.width??undefined,height:data.height??undefined,kind:getMediaKind(data.mime_type,data.path) } });
}
