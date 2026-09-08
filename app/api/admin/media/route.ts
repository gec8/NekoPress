import { NextResponse } from "next/server";
import { getAdminMedia } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/admin";
import { isMissingMediaCatalog, removeMediaAsset } from "@/lib/media-assets";
import { z } from "zod";
import { recordAdminAudit } from "@/lib/admin-audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getAdminMedia();
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ items: result.data }, { headers: { "cache-control": "no-store" } });
}

const pathSchema=z.string().regex(/^uploads\/(?:\d{4}-\d{2}-\d{2}|resumable)\/[0-9a-f-]{36}(?:--[^/]{1,600})?\.(jpg|jpeg|png|webp|gif|avif|mp3|wav|ogg|mp4|webm)$/i);

const metadataSchema=z.object({path:pathSchema,width:z.number().int().positive().max(6000).optional(),height:z.number().int().positive().max(6000).optional(),duration:z.number().finite().nonnegative().max(24*60*60).optional()}).refine(value=>value.width!==undefined||value.height!==undefined||value.duration!==undefined);

export async function PATCH(request:Request){
  const auth=await requireAdmin();
  if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  const parsed=metadataSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"媒体信息无效"},{status:400});
  const values:Record<string,number|string>={updated_at:new Date().toISOString()};
  if(parsed.data.width!==undefined)values.width=parsed.data.width;
  if(parsed.data.height!==undefined)values.height=parsed.data.height;
  if(parsed.data.duration!==undefined)values.duration_seconds=parsed.data.duration;
  const {error}=await auth.admin.from("media_assets").update(values).eq("path",parsed.data.path);
  if(error&&!isMissingMediaCatalog(error))return NextResponse.json({error:"媒体信息保存失败"},{status:500});
  return NextResponse.json({ok:true});
}

export async function DELETE(request:Request){
  const auth=await requireAdmin();
  if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  if(auth.role!=="admin")return NextResponse.json({error:"只有管理员可以删除媒体"},{status:403});
  const parsed=pathSchema.safeParse(new URL(request.url).searchParams.get("path"));
  if(!parsed.success)return NextResponse.json({error:"无效的媒体路径"},{status:400});
  const bucket=process.env.SUPABASE_STORAGE_BUCKET||"media";
  const url=auth.admin.storage.from(bucket).getPublicUrl(parsed.data).data.publicUrl;
  const catalogCheck=await auth.admin.from("media_assets").select("id,original_name,media_references(resource_type,field_name)").eq("path",parsed.data).maybeSingle();
  let usedBy:string[]=[];
  if(catalogCheck.error&&!isMissingMediaCatalog(catalogCheck.error)){
    console.error("[media-catalog-reference-check]",catalogCheck.error);
    return NextResponse.json({error:"无法确认媒体引用状态，请稍后重试"},{status:503});
  }
  if(catalogCheck.data){
    const labels:Record<string,string>={"article:cover":"文章封面","article:content":"文章正文","moment:image":"动态","carousel:image":"首页轮播","site_settings:logo":"网站标志","site_settings:default_cover":"默认封面"};
    const references=Array.isArray(catalogCheck.data.media_references)?catalogCheck.data.media_references:[];
    usedBy=[...new Set(references.map(reference=>labels[`${reference.resource_type}:${reference.field_name}`]??"内容"))];
  }else{
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

  usedBy = referenceChecks.flatMap(({ label, result }) =>
    result.data?.length ? [label] : [],
  );
  if ((articleBodies.data ?? []).some((row) => JSON.stringify(row.content ?? "").includes(url))) {
    usedBy.push("文章正文");
  }
  }
  if(usedBy.length)return NextResponse.json({error:`媒体正在被${usedBy.join("、")}使用，不能删除`,usedBy},{status:409});
  const {error}=await auth.admin.storage.from(bucket).remove([parsed.data]);
  if(error){console.error("[media-delete]",error);return NextResponse.json({error:"媒体删除失败，请稍后重试"},{status:500});}
  await removeMediaAsset(auth.admin,parsed.data);
  await recordAdminAudit(auth.admin,{actorId:auth.userId,actorEmail:auth.email,action:"delete",resource:"media",resourceId:parsed.data,label:String(catalogCheck.data?.original_name??parsed.data.split("/").at(-1)??parsed.data)});
  return NextResponse.json({ok:true});
}
