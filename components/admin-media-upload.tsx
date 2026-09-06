"use client";

import { LoaderCircle, Upload } from "lucide-react";
import { useState } from "react";
import { MEDIA_FILE_ACCEPT, validateMediaFileSelection } from "@/lib/media-types";

export type MediaUploadResult = {
  url: string;
  name: string;
  path: string;
  createdAt: string;
  size: number;
  kind: "image" | "audio" | "video";
  mime: string;
};

async function readUploadResult(response: Response): Promise<MediaUploadResult & { error?: string }> {
  try {
    return await response.json();
  } catch {
    throw new Error(response.ok ? "上传服务返回了无效结果" : `上传失败（${response.status}）`);
  }
}

export function AdminMediaUpload({ onUploaded }: { onUploaded?: (item: MediaUploadResult) => void }) {
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function upload(files?: FileList | null) {
    const selectedFiles = Array.from(files ?? []);
    if (!selectedFiles.length) return;
    const invalidFiles = selectedFiles
      .map((file) => ({ file, error: validateMediaFileSelection(file) }))
      .filter((item) => item.error);
    if (invalidFiles.length) {
      setHasError(true);
      setMessage(`${invalidFiles[0].file.name}：${invalidFiles[0].error}`);
      return;
    }

    setBusy(true);
    setHasError(false);
    let uploaded = 0;
    const failures: string[] = [];
    for (const [index, file] of selectedFiles.entries()) {
      setMessage(`正在上传 ${index + 1}/${selectedFiles.length}：${file.name}`);
      const body = new FormData();
      body.set("file", file);
      try {
        const response = await fetch("/api/upload", { method: "POST", body });
        const result = await readUploadResult(response);
        if (!response.ok) {
          failures.push(`${file.name}：${result.error || "上传失败"}`);
          continue;
        }
        uploaded += 1;
        onUploaded?.(result);
      } catch (reason) {
        failures.push(`${file.name}：${reason instanceof Error ? reason.message : "无法连接上传服务"}`);
      }
    }
    setHasError(failures.length > 0);
    setMessage(
      failures.length
        ? `成功 ${uploaded} 个，失败 ${failures.length} 个。${failures[0]}`
        : `上传完成，共 ${uploaded} 个文件。`,
    );
    setBusy(false);
  }

  return (
    <div className="flex max-w-sm flex-col items-end gap-2">
      <label className={`btn-primary ${busy ? "cursor-wait opacity-70" : "cursor-pointer"}`}>
        {busy ? <LoaderCircle className="animate-spin" size={15} /> : <Upload size={15} />}
        {busy ? "上传中…" : "上传媒体"}
        <input
          accept={MEDIA_FILE_ACCEPT}
          className="sr-only"
          disabled={busy}
          multiple
          onChange={(event) => {
            void upload(event.target.files);
            event.target.value = "";
          }}
          type="file"
        />
      </label>
      {message && (
        <p
          aria-live="polite"
          className={`max-w-sm text-right text-xs leading-5 ${hasError ? "text-red-500" : "text-zinc-500"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
