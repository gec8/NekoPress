import { NextResponse } from "next/server";
import { getAdminMedia } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getAdminMedia();
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ items: result.data }, { headers: { "cache-control": "no-store" } });
}

const pathSchema=z.string().regex(/^uploads\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.(jpg|png|webp|gif|avif)$/i);

export async function DELETE(request:Request){
  const auth=await requireAdmin();
  if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  if(auth.role!=="admin")return NextResponse.json({error:"只有管理员可以删除媒体"},{status:403});
  const parsed=pathSchema.safeParse(new URL(request.url).searchParams.get("path"));
  if(!parsed.success)return NextResponse.json({error:"无效的媒体路径"},{status:400});
  const bucket=process.env.SUPABASE_STORAGE_BUCKET||"media";
  const url=auth.admin.storage.from(bucket).getPublicUrl(parsed.data).data.publicUrl;
  const checks=await Promise.all([
    auth.admin.from("articles").select("id").eq("image_url",url).limit(1),
    auth.admin.from("moments").select("id").eq("image_url",url).limit(1),
    auth.admin.from("carousel_items").select("id").eq("image_url",url).limit(1),
    auth.admin.from("site_settings").select("id").or(`logo_url.eq.${url},default_cover_url.eq.${url}`).limit(1),
  ]);
  if(checks.some(result=>result.error)){console.error("[media-reference-check]",checks.map(result=>result.error).filter(Boolean));return NextResponse.json({error:"无法确认图片使用状态，请稍后重试"},{status:503});}
  const labels=["文章封面","动态","首页轮播","网站设置"];
  const usedBy=checks.flatMap((result,index)=>result.data?.length?[labels[index]]:[]);
  if(usedBy.length)return NextResponse.json({error:`图片正在被${usedBy.join("、")}使用，不能删除`,usedBy},{status:409});
  const {error}=await auth.admin.storage.from(bucket).remove([parsed.data]);
  if(error){console.error("[media-delete]",error);return NextResponse.json({error:"图片删除失败，请稍后重试"},{status:500});}
  return NextResponse.json({ok:true});
}
