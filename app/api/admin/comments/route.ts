import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { revalidateAdminContent } from "@/lib/revalidation";

const moderationSchema = z.object({
  id: z.string().uuid(),
  approved: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = moderationSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "无效的评论审核参数" }, { status: 400 });
  const { data, error } = await auth.admin
    .from("comments")
    .update({ approved: parsed.data.approved })
    .eq("id", parsed.data.id)
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateAdminContent();
  revalidatePathForComments();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.role !== "admin") return NextResponse.json({ error: "只有管理员可以删除评论" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return NextResponse.json({ error: "无效的评论 id" }, { status: 400 });
  const { error } = await auth.admin.from("comments").delete().eq("id", parsed.data);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateAdminContent();
  revalidatePathForComments();
  return NextResponse.json({ ok: true });
}

function revalidatePathForComments() {
  // Public comments are also fetched dynamically, while this refreshes any
  // server-rendered initial comment lists that may exist in production caches.
  revalidatePath("/article/[slug]", "page");
}
