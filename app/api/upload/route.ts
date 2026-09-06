import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { inspectMedia, MAX_MEDIA_BYTES } from "@/lib/media-validation";
import { consumeFixedWindow } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const contentLength=Number(req.headers.get("content-length")||0);
    if(contentLength>MAX_MEDIA_BYTES+512*1024)return NextResponse.json({error:"上传内容不能超过 50MB"},{status:413});
    const limit=consumeFixedWindow(`upload:${auth.userId}`,30,10*60*1000);
    if(!limit.allowed)return NextResponse.json({error:"上传过于频繁，请稍后重试"},{status:429,headers:{"Retry-After":String(limit.retryAfterSeconds)}});
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "请选择媒体文件" }, { status: 400 });
    if (file.size > MAX_MEDIA_BYTES) return NextResponse.json({ error: "音视频不能超过 50MB，图片不能超过 8MB" }, { status: 413 });
    const bytes=Buffer.from(await file.arrayBuffer());
    const inspection=inspectMedia(bytes,file.type);
    if(!inspection.ok)return NextResponse.json({error:inspection.error},{status:415});

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
    const objectPath = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${inspection.info.extension}`;
    const { error } = await auth.admin.storage.from(bucket).upload(
      objectPath,
      bytes,
      { contentType: inspection.info.mime, cacheControl: "31536000", upsert: false },
    );
    if (error) {console.error("[media-upload]",error);return NextResponse.json({ error:"图片存储失败，请稍后重试" }, { status: 500 });}

    const { data } = auth.admin.storage.from(bucket).getPublicUrl(objectPath);
    return NextResponse.json({ url:data.publicUrl, kind:inspection.info.kind, mime:inspection.info.mime, width:inspection.info.width, height:inspection.info.height });
  } catch (error) {
    console.error("[media-upload]",error);
    return NextResponse.json({ error:"图片上传失败，请稍后重试" }, { status: 500 });
  }
}
