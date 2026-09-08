import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { upsertMediaAsset } from "@/lib/media-assets";
import { inspectMedia, MAX_MEDIA_BYTES } from "@/lib/media-validation";
import { encodeMediaDisplayName, getMediaMime, normalizeMediaDisplayName, RESUMABLE_MEDIA_THRESHOLD } from "@/lib/media-types";
import { consumeFixedWindow } from "@/lib/request-security";
import { recordAdminAudit } from "@/lib/admin-audit";
import { createServerClientSafe } from "@/lib/supabase/server";

export const runtime = "nodejs";

const requestSchema = z.object({
  uploadId: z.uuid(),
  name: z.string().trim().min(1).max(255),
  mime: z.string().max(100),
  size: z.number().int().positive().max(MAX_MEDIA_BYTES),
  signature: z.string().min(4).max(512),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

const completionSchema = z.object({
  path: z.string().regex(/^uploads\/resumable\/[0-9a-f-]{36}--[A-Za-z0-9_-]+\.(mp3|wav|ogg|mp4|webm)$/i),
  name: z.string().trim().min(1).max(180),
  mime: z.string().max(100),
  size: z.number().int().positive().max(MAX_MEDIA_BYTES),
});

function resumableEndpoint(supabaseUrl: string) {
  const url = new URL(supabaseUrl);
  const match = url.hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i);
  const origin = match ? `${url.protocol}//${match[1]}.storage.supabase.co` : url.origin;
  return `${origin}/storage/v1/upload/resumable`;
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "断点续传参数无效" }, { status: 400 });
  if (parsed.data.size <= RESUMABLE_MEDIA_THRESHOLD) {
    return NextResponse.json({ error: "小文件请使用标准上传" }, { status: 400 });
  }
  const limit = consumeFixedWindow(`resumable-upload:${auth.userId}`, 30, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "上传请求过于频繁，请稍后重试" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const claimedMime = getMediaMime(parsed.data.mime, parsed.data.name);
  const signature = Buffer.from(parsed.data.signature, "base64");
  const inspection = inspectMedia(signature, claimedMime);
  if (!inspection.ok) return NextResponse.json({ error: inspection.error }, { status: 415 });
  if (inspection.info.kind === "image") {
    return NextResponse.json({ error: "图片请使用标准上传" }, { status: 400 });
  }

  const displayName = normalizeMediaDisplayName(parsed.data.name, inspection.info.extension);
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
  const path = `uploads/resumable/${parsed.data.uploadId}--${encodeMediaDisplayName(displayName)}.${inspection.info.extension}`;
  // Supabase TUS endpoints validate the user's access token directly. Using the
  // browser session here avoids mixing signed-upload tokens with TUS JWT auth.
  const sessionClient = await createServerClientSafe();
  const { data: sessionData, error: sessionError } = sessionClient
    ? await sessionClient.auth.getSession()
    : { data: { session: null }, error: null };
  const accessToken = sessionData.session?.access_token;
  if (sessionError || !accessToken) {
    return NextResponse.json({ error: "登录已过期，请重新登录后上传" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return NextResponse.json({ error: "Supabase 地址未配置" }, { status: 503 });
  const url = auth.admin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  await upsertMediaAsset(auth.admin, {
    path,
    url,
    name: displayName,
    mime: inspection.info.mime,
    size: parsed.data.size,
    userId: auth.userId,
    status: "uploading",
    contentHash: parsed.data.contentHash,
  });
  return NextResponse.json({
    endpoint: resumableEndpoint(supabaseUrl),
    accessToken,
    bucket,
    url,
    name: displayName,
    path,
    createdAt: new Date().toISOString(),
    size: parsed.data.size,
    kind: inspection.info.kind,
    mime: inspection.info.mime,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = completionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "上传完成参数无效" }, { status: 400 });
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
  const { data: fileInfo, error } = await auth.admin.storage.from(bucket).info(parsed.data.path);
  if (error || !fileInfo) {
    console.error("[resumable-upload-complete]", error);
    return NextResponse.json({ error: "无法确认断点续传结果" }, { status: 503 });
  }
  const url = auth.admin.storage.from(bucket).getPublicUrl(parsed.data.path).data.publicUrl;
  await upsertMediaAsset(auth.admin, {
    path: parsed.data.path,
    url,
    name: parsed.data.name,
    mime: parsed.data.mime,
    size: Number(fileInfo.size ?? parsed.data.size),
    userId: auth.userId,
    status: "ready",
  });
  await recordAdminAudit(auth.admin,{actorId:auth.userId,actorEmail:auth.email,action:"upload",resource:"media",resourceId:parsed.data.path,label:parsed.data.name,metadata:{kind:inspectionKind(parsed.data.mime),mime:parsed.data.mime,size:Number(fileInfo.size??parsed.data.size),resumable:true}});
  return NextResponse.json({ ok: true });
}

function inspectionKind(mime:string){return mime.startsWith("video/")?"video":"audio";}
