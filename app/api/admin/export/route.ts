import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { recordAdminAudit } from "@/lib/admin-audit";
import { isMissingMediaCatalog } from "@/lib/media-assets";

export const dynamic="force-dynamic";

export async function GET(){
  const auth=await requireAdmin();
  if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  if(auth.role!=="admin")return NextResponse.json({error:"只有管理员可以导出备份"},{status:403});
  const [articles,moments,categories,carousel,settings,mediaAssets,mediaReferences]=await Promise.all([
    auth.admin.from("articles").select("*").order("id"),auth.admin.from("moments").select("*").order("id"),auth.admin.from("categories").select("*").order("sort_order"),auth.admin.from("carousel_items").select("*").order("sort_order"),auth.admin.from("site_settings").select("*").limit(1),
    auth.admin.from("media_assets").select("*").order("created_at"),auth.admin.from("media_references").select("*").order("id"),
  ]);
  const failed=[articles,moments,categories,carousel,settings].find(result=>result.error);
  if(failed?.error)return NextResponse.json({error:"备份数据读取失败，请检查系统状态后重试"},{status:503});
  const mediaUnavailable=isMissingMediaCatalog(mediaAssets.error)||isMissingMediaCatalog(mediaReferences.error);
  if((mediaAssets.error||mediaReferences.error)&&!mediaUnavailable)return NextResponse.json({error:"媒体清单读取失败，请检查系统状态后重试"},{status:503});
  const generatedAt=new Date();
  const assets=mediaUnavailable?[]:mediaAssets.data??[];
  const references=mediaUnavailable?[]:mediaReferences.data??[];
  const backup={format:"nekopress-content-backup",version:2,generatedAt:generatedAt.toISOString(),storage:{bucket:process.env.SUPABASE_STORAGE_BUCKET||"media",filesIncluded:false,note:"媒体文件需单独备份 Storage 存储桶；本文件保存媒体路径、元数据和内容引用关系。"},data:{articles:articles.data??[],moments:moments.data??[],categories:categories.data??[],carouselItems:carousel.data??[],siteSettings:settings.data?.[0]??null,mediaAssets:assets,mediaReferences:references}};
  await recordAdminAudit(auth.admin,{actorId:auth.userId,actorEmail:auth.email,action:"export",resource:"backup",label:"内容与媒体清单备份",metadata:{articles:articles.data?.length??0,mediaAssets:assets.length,mediaReferences:references.length,mediaCatalogIncluded:!mediaUnavailable}});
  return new NextResponse(JSON.stringify(backup,null,2),{headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename="nekopress-backup-${generatedAt.toISOString().slice(0,10)}.json"`,"Cache-Control":"no-store, private"}});
}
