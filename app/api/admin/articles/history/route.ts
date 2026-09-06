import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { revalidateAdminContent, revalidateArticleContent } from "@/lib/revalidation";
import { recordAdminAudit } from "@/lib/admin-audit";

const schema=z.object({articleId:z.number().int().positive(),versionId:z.number().int().positive()});

export async function POST(request:Request){
  const auth=await requireAdmin();if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  const parsed=schema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"版本恢复参数无效"},{status:400});
  const [{data:article,error:articleError},{data:version,error:versionError}]=await Promise.all([
    auth.admin.from("articles").select("*").eq("id",parsed.data.articleId).maybeSingle(),
    auth.admin.from("article_versions").select("snapshot").eq("id",parsed.data.versionId).eq("article_id",parsed.data.articleId).maybeSingle(),
  ]);
  if(articleError||versionError)return NextResponse.json({error:articleError?.message??versionError?.message},{status:500});
  if(!article||!version)return NextResponse.json({error:"文章或历史版本不存在"},{status:404});
  if(article.deleted_at)return NextResponse.json({error:"请先从回收站恢复文章"},{status:409});
  const snapshot=version.snapshot as Record<string,unknown>;
  const restored={title:snapshot.title,slug:snapshot.slug,excerpt:snapshot.excerpt,content:snapshot.content,category:snapshot.category,author:snapshot.author,image_url:snapshot.image_url,tags:snapshot.tags,featured:snapshot.featured,published:snapshot.published,published_at:snapshot.published_at};
  const {error}=await auth.admin.from("articles").update(restored).eq("id",parsed.data.articleId);if(error)return NextResponse.json({error:error.message},{status:500});
  const saved=await auth.admin.from("article_versions").insert({article_id:parsed.data.articleId,snapshot:article,change_type:"restore",created_by:auth.userId});if(saved.error)console.error("[article-version]",saved.error);
  await recordAdminAudit(auth.admin,{actorId:auth.userId,actorEmail:auth.email,action:"restore",resource:"articles",resourceId:parsed.data.articleId,label:String(snapshot.title??article.title??""),metadata:{versionId:parsed.data.versionId}});
  revalidateArticleContent(String(article.slug),String(snapshot.slug??""));revalidateAdminContent();return NextResponse.json({ok:true});
}
