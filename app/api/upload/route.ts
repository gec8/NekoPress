import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { upsertMediaAsset } from "@/lib/media-assets";
import { inspectMedia, MAX_MEDIA_BYTES } from "@/lib/media-validation";
import { encodeMediaDisplayName, getMediaMime, normalizeMediaDisplayName } from "@/lib/media-types";
import { consumeFixedWindow } from "@/lib/request-security";
import { recordAdminAudit } from "@/lib/admin-audit";

export const runtime = "nodejs";

function storageUploadMessage(error: { message?: string }) {
  const message = String(error.message ?? "").toLocaleLowerCase();
  if (message.includes("mime") || message.includes("content type")) {
    return "Supabase 媒体存储桶尚未允许该文件格式，请执行媒体存储升级";
  }
  if (message.includes("size") || message.includes("too large") || message.includes("maximum")) {
    return "文件超过 Supabase 媒体存储桶的大小限制";
  }
  if (message.includes("invalid key") || message.includes("invalid resource")) {
    return "媒体文件名无法用于存储，请修改文件名后重试";
  }
  return "媒体存储暂时不可用，请稍后重试";
}

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
    const contentHashValue=form.get("contentHash");
    const contentHash=typeof contentHashValue==="string"&&/^[a-f0-9]{64}$/.test(contentHashValue)?contentHashValue:undefined;
    if (!(file instanceof File)) return NextResponse.json({ error: "请选择媒体文件" }, { status: 400 });
    if (file.size > MAX_MEDIA_BYTES) return NextResponse.json({ error: "音视频不能超过 50MB，图片不能超过 8MB" }, { status: 413 });
    const bytes=Buffer.from(await file.arrayBuffer());
    const inspection=inspectMedia(bytes,getMediaMime(file.type,file.name));
    if(!inspection.ok)return NextResponse.json({error:inspection.error},{status:415});
    const displayName=normalizeMediaDisplayName(file.name,inspection.info.extension);

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
    const objectPath = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}--${encodeMediaDisplayName(displayName)}.${inspection.info.extension}`;
    const { error } = await auth.admin.storage.from(bucket).upload(
      objectPath,
      bytes,
      {
        contentType: inspection.info.mime,
        cacheControl: "31536000",
        upsert: false,
        metadata: { originalName: displayName },
      },
    );
    if (error) {console.error("[media-upload]",error);return NextResponse.json({ error:storageUploadMessage(error) }, { status: 500 });}

    const { data } = auth.admin.storage.from(bucket).getPublicUrl(objectPath);
    await upsertMediaAsset(auth.admin, {
      path: objectPath,
      url: data.publicUrl,
      name: displayName,
      mime: inspection.info.mime,
      size: file.size,
      width: inspection.info.width,
      height: inspection.info.height,
      userId: auth.userId,
      contentHash,
    });
    await recordAdminAudit(auth.admin,{actorId:auth.userId,actorEmail:auth.email,action:"upload",resource:"media",resourceId:objectPath,label:displayName,metadata:{kind:inspection.info.kind,mime:inspection.info.mime,size:file.size}});
    return NextResponse.json({
      url: data.publicUrl,
      name: displayName,
      path: objectPath,
      createdAt: new Date().toISOString(),
      size: file.size,
      kind: inspection.info.kind,
      mime: inspection.info.mime,
      width: inspection.info.width,
      height: inspection.info.height,
    });
  } catch (error) {
    console.error("[media-upload]",error);
    return NextResponse.json({ error:"媒体上传失败，请稍后重试" }, { status: 500 });
  }
}
