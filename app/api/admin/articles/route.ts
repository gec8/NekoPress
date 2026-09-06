import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { revalidateAdminContent, revalidateArticleContent } from "@/lib/revalidation";
import { recordAdminAudit } from "@/lib/admin-audit";

const articleSchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(2).max(180),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().trim().max(500).default(""),
  content: z.array(z.string().trim().min(1)).min(1),
  category: z.string().trim().min(1).max(40),
  author: z.string().trim().min(1).max(60).default("Neko"),
  imageUrl: z.string().url().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(30)).max(20).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  publishAt: z.string().datetime().optional(),
});

function dbPayload(v: z.infer<typeof articleSchema>, publishedAt?: string) {
  return { title: v.title, slug: v.slug, excerpt: v.excerpt, content: v.content, category: v.category, author: v.author, image_url: v.imageUrl, tags: v.tags, featured: v.featured, published: v.published, published_at: publishedAt };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(); if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = articleSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  const { data, error } = await auth.admin.from("articles").insert(dbPayload(parsed.data, parsed.data.published ? parsed.data.publishAt??new Date().toISOString() : undefined)).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await recordAdminAudit(auth.admin,{actorId:auth.userId,actorEmail:auth.email,action:"create",resource:"articles",resourceId:data.id,label:parsed.data.title});
  revalidateArticleContent(parsed.data.slug);
  revalidateAdminContent();
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(); if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = articleSchema.safeParse(await req.json()); if (!parsed.success || !parsed.data.id) return NextResponse.json({ error: "缺少有效文章 id" }, { status: 400 });
  const { data: previous } = await auth.admin.from("articles").select("*").eq("id", parsed.data.id).maybeSingle();
  if(!previous)return NextResponse.json({error:"文章不存在"},{status:404});
  if(previous.deleted_at)return NextResponse.json({error:"回收站中的文章不能直接编辑，请先恢复"},{status:409});
  const publishedAt = parsed.data.published ? parsed.data.publishAt??(!previous?.published?new Date().toISOString():String(previous.published_at??new Date().toISOString())) : previous?.published_at ? String(previous.published_at) : undefined;
  const { data, error } = await auth.admin.from("articles").update(dbPayload(parsed.data, publishedAt)).eq("id", parsed.data.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const version=await auth.admin.from("article_versions").insert({article_id:parsed.data.id,snapshot:previous,change_type:"update",created_by:auth.userId});
  if(version.error)console.error("[article-version]",version.error);
  await recordAdminAudit(auth.admin,{actorId:auth.userId,actorEmail:auth.email,action:"update",resource:"articles",resourceId:parsed.data.id,label:parsed.data.title,metadata:{published:parsed.data.published}});
  revalidateArticleContent(previous?.slug ? String(previous.slug) : null, parsed.data.slug);
  revalidateAdminContent();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(); if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.role !== "admin") return NextResponse.json({ error: "只有管理员可以删除文章" }, { status: 403 });
  const id = Number(req.nextUrl.searchParams.get("id")); if (!Number.isFinite(id)) return NextResponse.json({ error: "无效 id" }, { status: 400 });
  const { data: previous } = await auth.admin.from("articles").select("*").eq("id", id).maybeSingle();
  if(!previous)return NextResponse.json({error:"文章不存在"},{status:404});
  const { error } = await auth.admin.from("articles").update({deleted_at:new Date().toISOString(),deleted_by:auth.userId,published:false,featured:false}).eq("id", id);
  if (error) return NextResponse.json({ error:error.message.includes("deleted_at")?"请先执行文章回收站数据库迁移":error.message }, { status: 500 });
  const version=await auth.admin.from("article_versions").insert({article_id:id,snapshot:previous,change_type:"trash",created_by:auth.userId});
  if(version.error)console.error("[article-version]",version.error);
  await recordAdminAudit(auth.admin,{actorId:auth.userId,actorEmail:auth.email,action:"trash",resource:"articles",resourceId:id,label:String(previous.title??"")});
  revalidateArticleContent(previous?.slug ? String(previous.slug) : null);
  revalidateAdminContent();
  return NextResponse.json({ ok: true });
}

const trashActionSchema=z.object({id:z.number().int().positive(),action:z.enum(["restore","destroy"])});
export async function PUT(req:NextRequest){
  const auth=await requireAdmin();if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  if(auth.role!=="admin")return NextResponse.json({error:"只有管理员可以管理回收站"},{status:403});
  const parsed=trashActionSchema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"回收站操作参数无效"},{status:400});
  const {data:article,error:readError}=await auth.admin.from("articles").select("*").eq("id",parsed.data.id).maybeSingle();
  if(readError)return NextResponse.json({error:readError.message},{status:500});if(!article)return NextResponse.json({error:"文章不存在"},{status:404});
  if(!article.deleted_at)return NextResponse.json({error:"文章不在回收站中"},{status:409});
  if(parsed.data.action==="destroy"){
    const {error}=await auth.admin.from("articles").delete().eq("id",parsed.data.id).not("deleted_at","is",null);if(error)return NextResponse.json({error:error.message},{status:500});
  }else{
    const {error}=await auth.admin.from("articles").update({deleted_at:null,deleted_by:null}).eq("id",parsed.data.id);if(error)return NextResponse.json({error:error.message},{status:500});
  }
  await recordAdminAudit(auth.admin,{actorId:auth.userId,actorEmail:auth.email,action:parsed.data.action,resource:"articles",resourceId:parsed.data.id,label:String(article.title??"")});
  revalidateArticleContent(String(article.slug));revalidateAdminContent();return NextResponse.json({ok:true});
}
