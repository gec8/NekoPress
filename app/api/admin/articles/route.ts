import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { revalidateAdminContent, revalidateArticleContent } from "@/lib/revalidation";

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
});

function dbPayload(v: z.infer<typeof articleSchema>, publishedAt?: string) {
  return { title: v.title, slug: v.slug, excerpt: v.excerpt, content: v.content, category: v.category, author: v.author, image_url: v.imageUrl, tags: v.tags, featured: v.featured, published: v.published, published_at: publishedAt };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(); if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = articleSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  const { data, error } = await auth.admin.from("articles").insert(dbPayload(parsed.data, parsed.data.published ? new Date().toISOString() : undefined)).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateArticleContent(parsed.data.slug);
  revalidateAdminContent();
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(); if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = articleSchema.safeParse(await req.json()); if (!parsed.success || !parsed.data.id) return NextResponse.json({ error: "缺少有效文章 id" }, { status: 400 });
  const { data: previous } = await auth.admin.from("articles").select("slug,published,published_at").eq("id", parsed.data.id).maybeSingle();
  const publishedAt = parsed.data.published && !previous?.published ? new Date().toISOString() : previous?.published_at ? String(previous.published_at) : undefined;
  const { data, error } = await auth.admin.from("articles").update(dbPayload(parsed.data, publishedAt)).eq("id", parsed.data.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateArticleContent(previous?.slug ? String(previous.slug) : null, parsed.data.slug);
  revalidateAdminContent();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(); if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.role !== "admin") return NextResponse.json({ error: "只有管理员可以删除文章" }, { status: 403 });
  const id = Number(req.nextUrl.searchParams.get("id")); if (!Number.isFinite(id)) return NextResponse.json({ error: "无效 id" }, { status: 400 });
  const { data: previous } = await auth.admin.from("articles").select("slug").eq("id", id).maybeSingle();
  const { error } = await auth.admin.from("articles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateArticleContent(previous?.slug ? String(previous.slug) : null);
  revalidateAdminContent();
  return NextResponse.json({ ok: true });
}
