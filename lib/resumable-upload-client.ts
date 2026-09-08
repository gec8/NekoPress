"use client";

import { Upload } from "tus-js-client";
import { getMediaKind, RESUMABLE_MEDIA_THRESHOLD } from "@/lib/media-types";

const TUS_CHUNK_SIZE = 6 * 1024 * 1024;

export type ResumableUploadResult = {
  url: string;
  name: string;
  path: string;
  createdAt: string;
  size: number;
  kind: "audio" | "video";
  mime: string;
};

type UploadTicket = ResumableUploadResult & {
  endpoint: string;
  accessToken: string;
  bucket: string;
};

export type ResumableUploadErrorCode = "authorization" | "network" | "upload";

export class ResumableUploadError extends Error {
  constructor(message: string, public readonly code: ResumableUploadErrorCode, options?: ErrorOptions) {
    super(message, options);
    this.name = "ResumableUploadError";
  }
}

function normalizeUploadError(reason: unknown) {
  const detail = reason instanceof Error ? reason.message : String(reason ?? "");
  if (/401|403|unauthorized|compact jws|jwt|signature/i.test(detail)) {
    return new ResumableUploadError("断点续传授权失败", "authorization", { cause: reason });
  }
  if (/fetch|network|timeout|failed to connect/i.test(detail)) {
    return new ResumableUploadError("上传网络不稳定，请稍后重试", "network", { cause: reason });
  }
  return new ResumableUploadError("断点续传失败，请稍后重试", "upload", { cause: reason });
}

export async function hashMediaFile(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function uploadStandardMedia(file: File, signal: AbortSignal, contentHash?: string): Promise<ResumableUploadResult & { kind: "image" | "audio" | "video" }> {
  const body = new FormData();
  body.set("file", file);
  if (contentHash) body.set("contentHash", contentHash);
  const response = await fetch("/api/upload", { method: "POST", body, signal });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new Error(result?.error ?? `上传失败（${response.status}）`);
  return result;
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function uploadIdentity(file: File) {
  return `neko:tus:${file.name}:${file.size}:${file.lastModified}`;
}

async function createTicket(file: File, contentHash?: string): Promise<UploadTicket> {
  const key = uploadIdentity(file);
  let uploadId = localStorage.getItem(key);
  if (!uploadId) {
    uploadId = crypto.randomUUID();
    localStorage.setItem(key, uploadId);
  }
  const signature = toBase64(new Uint8Array(await file.slice(0, 64).arrayBuffer()));
  const response = await fetch("/api/upload/resumable", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ uploadId, name: file.name, mime: file.type, size: file.size, signature, contentHash }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) {
    if (response.status === 401 || response.status === 403) {
      throw new ResumableUploadError(result?.error ?? "登录已过期", "authorization");
    }
    throw new Error(result?.error ?? "无法创建断点续传任务");
  }
  return result as UploadTicket;
}

async function completeTicket(ticket: UploadTicket) {
  const body = JSON.stringify({ path: ticket.path, name: ticket.name, mime: ticket.mime, size: ticket.size });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("/api/upload/resumable", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body,
      });
      if (response.ok) return;
    } catch {
      // The uploaded object is already safe in Storage; retry catalog registration once.
    }
  }
  console.warn("媒体已上传，但媒体目录登记暂时失败", ticket.path);
}

export function shouldUseResumableUpload(file: File) {
  return file.size > RESUMABLE_MEDIA_THRESHOLD && getMediaKind(file.type, file.name) !== "image";
}

export async function uploadResumable(
  file: File,
  options: {
    signal: AbortSignal;
    onProgress: (percentage: number) => void;
    onUploadReady: (upload: Upload) => void;
    contentHash?: string;
  },
): Promise<ResumableUploadResult> {
  const ticket = await createTicket(file, options.contentHash);
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      options.signal.removeEventListener("abort", abort);
      callback();
    };
    const upload = new Upload(file, {
      endpoint: ticket.endpoint,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      headers: {
        authorization: `Bearer ${ticket.accessToken}`,
        "x-upsert": "false",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: TUS_CHUNK_SIZE,
      metadata: {
        bucketName: ticket.bucket,
        objectName: ticket.path,
        contentType: ticket.mime,
        cacheControl: "31536000",
        metadata: JSON.stringify({ originalName: ticket.name }),
      },
      onProgress: (uploaded, total) => options.onProgress(total ? Math.round((uploaded / total) * 100) : 0),
      onError: (error) => finish(() => reject(normalizeUploadError(error))),
      onSuccess: () => void completeTicket(ticket).finally(() => finish(() => {
          localStorage.removeItem(uploadIdentity(file));
          resolve(ticket);
        })),
    });
    const abort = () => {
      void upload.abort(false).finally(() => finish(() => reject(new DOMException("上传已取消", "AbortError"))));
    };
    options.signal.addEventListener("abort", abort, { once: true });
    options.onUploadReady(upload);
    void upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads[0]) upload.resumeFromPreviousUpload(previousUploads[0]);
      if (!options.signal.aborted) upload.start();
    }).catch((error) => finish(() => reject(normalizeUploadError(error))));
  });
}
