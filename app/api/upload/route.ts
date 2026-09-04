import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "请选择图片" }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "图片不能超过 8MB" }, { status: 413 });
    const extension = imageExtensions[file.type];
    if (!extension) return NextResponse.json({ error: "仅支持 JPG、PNG、WebP、GIF 和 AVIF" }, { status: 415 });

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
    const objectPath = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const { error } = await auth.admin.storage.from(bucket).upload(
      objectPath,
      Buffer.from(await file.arrayBuffer()),
      { contentType: file.type, cacheControl: "31536000", upsert: false },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data } = auth.admin.storage.from(bucket).getPublicUrl(objectPath);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "图片上传失败" }, { status: 500 });
  }
}
