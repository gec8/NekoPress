"use client";

import { ImagePlus, Music, Video, X } from "lucide-react";
import { useRef, useState } from "react";
import { MediaPicker } from "@/components/media-picker";
import { validateMediaFileSelection } from "@/lib/media-types";
import { ResumableUploadError, shouldUseResumableUpload, uploadResumable, uploadStandardMedia } from "@/lib/resumable-upload-client";

type MediaKind = "image" | "audio" | "video";
type Pending = { kind: "audio" | "video"; url: string };

export function ContentMediaUpload({ onInsert }: { onInsert: (markup: string) => void }) {
  const [busy, setBusy] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [cover, setCover] = useState("");
  const [progress, setProgress] = useState(0);
  const uploadController = useRef<AbortController | null>(null);

  async function upload(file: File | undefined, requestedKind: MediaKind) {
    if (!file) return;
    const selectionError = validateMediaFileSelection(file);
    if (selectionError) {
      window.alert(selectionError);
      return;
    }
    setBusy(requestedKind);
    setProgress(0);
    uploadController.current = new AbortController();
    try {
      let result: { url: string; name: string; kind: MediaKind };
      if (shouldUseResumableUpload(file)) {
        try {
          result = await uploadResumable(file, {
            signal: uploadController.current.signal,
            onUploadReady: () => undefined,
            onProgress: setProgress,
          });
        } catch (reason) {
          if (!(reason instanceof ResumableUploadError && reason.code === "authorization")) throw reason;
          setProgress(0);
          result = await uploadStandardMedia(file, uploadController.current.signal);
        }
      } else {
        result = await uploadStandardMedia(file, uploadController.current.signal);
      }
      if (result.kind !== requestedKind) {
        throw new Error(`文件实际类型与“${requestedKind === "image" ? "图片" : requestedKind === "audio" ? "音频" : "视频"}”不一致`);
      }
      if (result.kind === "image") {
        onInsert(`![图片描述](${result.url})`);
      } else {
        setTitle(String(result.name || file.name).replace(/\.[^.]+$/, "") || "媒体标题");
        setAuthor("");
        setCover("");
        setPending({ kind: result.kind, url: result.url });
      }
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) {
        window.alert(reason instanceof Error ? reason.message : "上传失败");
      }
    } finally {
      setBusy("");
      setProgress(0);
      uploadController.current = null;
    }
  }

  function insert() {
    if (!pending) return;
    const clean = (value: string) => value.replace(/[()|]/g, " ").trim();
    onInsert(
      `@[${pending.kind}](${clean(title) || "媒体标题"})(${pending.url})(${cover})(${pending.kind === "audio" ? clean(author) : ""})`,
    );
    setPending(null);
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <UploadItem
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          busy={busy === "image"}
          disabled={Boolean(busy)}
          icon={<ImagePlus size={14} />}
          label="图片"
          select={(file) => void upload(file, "image")}
        />
        <UploadItem
          accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg"
          busy={busy === "audio"}
          disabled={Boolean(busy)}
          icon={<Music size={14} />}
          label="音频"
          select={(file) => void upload(file, "audio")}
        />
        <UploadItem
          accept="video/mp4,video/webm"
          busy={busy === "video"}
          disabled={Boolean(busy)}
          icon={<Video size={14} />}
          label="视频"
          select={(file) => void upload(file, "video")}
        />
        {busy && progress > 0 && <span className="px-1 text-[11px] font-bold text-pink-500">{progress}%</span>}
        {busy && (
          <button aria-label="取消上传" className="grid h-7 w-7 place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => uploadController.current?.abort()} type="button">
            <X size={13} />
          </button>
        )}
      </div>
      {pending && (
        <div
          aria-label="设置媒体信息"
          aria-modal="true"
          className="fixed inset-0 z-[120] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
          role="dialog"
        >
          <section className="panel w-full max-w-lg p-5 sm:p-6">
            <header className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black">设置{pending.kind === "audio" ? "音频" : "视频"}信息</h2>
                <p className="mt-1 text-xs text-zinc-500">完善标题和封面后插入正文。</p>
              </div>
              <button
                aria-label="关闭"
                className="grid h-9 w-9 place-items-center rounded-full bg-black/5 dark:bg-white/5"
                onClick={() => setPending(null)}
                type="button"
              >
                <X size={16} />
              </button>
            </header>
            <div className="mt-5 grid gap-4">
              <label className="text-xs font-bold text-zinc-500">
                标题
                <input autoFocus className="field mt-1" maxLength={100} onChange={(event) => setTitle(event.target.value)} value={title} />
              </label>
              {pending.kind === "audio" && (
                <label className="text-xs font-bold text-zinc-500">
                  作者 / 嘉宾
                  <input className="field mt-1" maxLength={80} onChange={(event) => setAuthor(event.target.value)} placeholder="选填" value={author} />
                </label>
              )}
              <label className="text-xs font-bold text-zinc-500">
                封面地址
                <input className="field mt-1" onChange={(event) => setCover(event.target.value)} placeholder="选填，留空使用默认封面" value={cover} />
              </label>
              <MediaPicker onSelect={setCover} value={cover} />
              <div className="flex justify-end gap-2">
                <button className="page-btn" onClick={() => setPending(null)} type="button">取消</button>
                <button className="btn-primary" onClick={insert} type="button">插入正文</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function UploadItem({ label, icon, accept, busy, disabled, select }: { label: string; icon: React.ReactNode; accept: string; busy: boolean; disabled: boolean; select: (file?: File) => void }) {
  return (
    <label className={`flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold hover:bg-pink-50 hover:text-pink-500 dark:hover:bg-pink-500/10 ${busy ? "cursor-wait opacity-60" : "cursor-pointer"}`}>
      {icon}
      {busy ? "上传中" : label}
      <input
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          select(event.target.files?.[0]);
          event.target.value = "";
        }}
        type="file"
      />
    </label>
  );
}
