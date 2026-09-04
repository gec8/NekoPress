import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { revalidateAdminContent, revalidateMomentContent } from "@/lib/revalidation";

const momentSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  content: z.string().trim().min(1).max(1000),
  mood: z.string().trim().min(1).max(40).default("动态"),
  publishedAt: z.string().datetime(),
  tags: z.array(z.string().trim().min(1).max(30)).max(20).default([]),
  imageUrl: z.string().trim().max(2048).default(""),
  published: z.boolean().default(false),
});

function dbPayload(value: z.infer<typeof momentSchema>) {
  return {
    content: value.content,
    mood: value.mood,
    published_at: value.publishedAt,
    tags: value.tags,
    image_url: value.imageUrl,
    published: value.published,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = momentSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  const { data, error } = await auth.admin.from("moments").insert(dbPayload(parsed.data)).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateMomentContent();
  revalidateAdminContent();
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = momentSchema.safeParse(await req.json());
  if (!parsed.success || !parsed.data.id) return NextResponse.json({ error: "缺少有效的 Moment id" }, { status: 400 });
  const { data, error } = await auth.admin.from("moments").update(dbPayload(parsed.data)).eq("id", parsed.data.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateMomentContent();
  revalidateAdminContent();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.role !== "admin") return NextResponse.json({ error: "只有管理员可以删除动态" }, { status: 403 });
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "无效的 Moment id" }, { status: 400 });
  const { error } = await auth.admin.from("moments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateMomentContent();
  revalidateAdminContent();
  return NextResponse.json({ ok: true });
}
