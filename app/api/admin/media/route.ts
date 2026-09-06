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

const pathSchema=z.string().regex(/^uploads\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}(?:--[^/]{1,600})?\.(jpg|jpeg|png|webp|gif|avif|mp3|wav|ogg|mp4|webm)$/i);

export async function DELETE(request:Request){
  const auth=await requireAdmin();
  if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  if(auth.role!=="admin")return NextResponse.json({error:"只有管理员可以删除媒体"},{status:403});
  const parsed=pathSchema.safeParse(new URL(request.url).searchParams.get("path"));
  if(!parsed.success)return NextResponse.json({error:"无效的媒体路径"},{status:400});
  const bucket=process.env.SUPABASE_STORAGE_BUCKET||"media";
  const url=auth.admin.storage.from(bucket).getPublicUrl(parsed.data).data.publicUrl;
  const [articleCovers, momentImages, carouselImages, siteLogos, siteCovers, articleBodies] =
    await Promise.all([
      auth.admin.from("articles").select("id").eq("image_url", url).limit(1),
      auth.admin.from("moments").select("id").eq("image_url", url).limit(1),
      auth.admin.from("carousel_items").select("id").eq("image_url", url).limit(1),
      auth.admin.from("site_settings").select("id").eq("logo_url", url).limit(1),
      auth.admin.from("site_settings").select("id").eq("default_cover_url", url).limit(1),
      auth.admin.from("articles").select("id,content").limit(1000),
    ]);

  const referenceChecks = [
    { label: "文章封面", result: articleCovers },
    { label: "动态", result: momentImages },
    { label: "首页轮播", result: carouselImages },
    { label: "网站标志", result: siteLogos },
    { label: "默认封面", result: siteCovers },
  ];
  const failedChecks = referenceChecks
    .filter(({ result }) => result.error)
    .map(({ label }) => label);
  if (articleBodies.error) failedChecks.push("文章正文");

  if (failedChecks.length) {
    console.error("[media-reference-check]", {
      failedChecks,
      errors: [...referenceChecks.map(({ result }) => result.error), articleBodies.error].filter(Boolean),
    });
    return NextResponse.json(
      { error: `无法检查${failedChecks.join("、")}中的媒体引用，请稍后重试` },
      { status: 503 },
    );
  }

  const usedBy = referenceChecks.flatMap(({ label, result }) =>
    result.data?.length ? [label] : [],
  );
  if ((articleBodies.data ?? []).some((row) => JSON.stringify(row.content ?? "").includes(url))) {
    usedBy.push("文章正文");
  }
  if(usedBy.length)return NextResponse.json({error:`媒体正在被${usedBy.join("、")}使用，不能删除`,usedBy},{status:409});
  const {error}=await auth.admin.storage.from(bucket).remove([parsed.data]);
  if(error){console.error("[media-delete]",error);return NextResponse.json({error:"媒体删除失败，请稍后重试"},{status:500});}
  return NextResponse.json({ok:true});
}
