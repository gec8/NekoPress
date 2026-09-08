"use client";

import { ChevronDown, Copy, ExternalLink, FilePlus2, FolderUp, ImageIcon, Link2, ListChecks, LoaderCircle, Music, Pause, Play, RotateCcw, Upload as UploadIcon, UploadCloud, X, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Upload as TusUpload } from "tus-js-client";
import { getMediaKind, MEDIA_FILE_ACCEPT, validateMediaFileSelection } from "@/lib/media-types";
import { hashMediaFile, ResumableUploadError, shouldUseResumableUpload, uploadResumable, uploadStandardMedia } from "@/lib/resumable-upload-client";

export type MediaUploadResult = {
  url: string;
  name: string;
  path: string;
  createdAt: string;
  size: number;
  kind: "image" | "audio" | "video";
  mime: string;
  width?: number;
  height?: number;
};

type QueueStatus = "waiting" | "uploading" | "success" | "failed" | "cancelled";
type QueueState = { status: QueueStatus; progress: number; error?: string };

export function AdminMediaUpload({ onUploaded }: { onUploaded?: (item: MediaUploadResult) => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [importingUrl, setImportingUrl] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [displayNames, setDisplayNames] = useState<string[]>([]);
  const [queueStates, setQueueStates] = useState<QueueState[]>([]);
  const [uploadedResults, setUploadedResults] = useState<Array<MediaUploadResult | null>>([]);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [resumableActive, setResumableActive] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const currentUpload = useRef<TusUpload | null>(null);
  const controller = useRef<AbortController | null>(null);
  const cancelRequested = useRef(false);
  const dragDepth = useRef(0);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const folderInput = useRef<HTMLInputElement | null>(null);
  const uploadAction = useRef<(files?: FileList | null) => Promise<void>>(async () => undefined);

  function selectFiles(files: File[]) {
    setPendingFiles(files);
    setDisplayNames(files.map(file => file.name));
    setQueueStates(files.map(() => ({ status: "waiting", progress: 0 })));
    setUploadedResults(files.map(() => null));
    setMessage("");
    setDialogOpen(true);
  }

  async function importFromUrl() {
    let parsed: URL;
    try { parsed = new URL(urlInput); }
    catch { setHasError(true); setMessage("请输入正确的媒体地址"); return; }
    if (!/^https?:$/.test(parsed.protocol)) { setHasError(true); setMessage("仅支持 HTTP 或 HTTPS 地址"); return; }
    setImportingUrl(true);
    setHasError(false);
    setMessage("正在读取链接媒体…");
    try {
      const response = await fetch(parsed.toString());
      if (!response.ok) throw new Error(`链接返回 ${response.status}`);
      const blob = await response.blob();
      const fallbackExtension = blob.type.startsWith("image/") ? ".jpg" : blob.type.startsWith("audio/") ? ".mp3" : blob.type.startsWith("video/") ? ".mp4" : "";
      const name = decodeURIComponent(parsed.pathname.split("/").pop() || `link-media${fallbackExtension}`);
      const file = new File([blob], name.includes(".") ? name : `${name}${fallbackExtension}`, { type: blob.type });
      const error = validateMediaFileSelection(file);
      if (error) throw new Error(error);
      selectFiles([file]);
      setUrlInput("");
    } catch (reason) {
      setHasError(true);
      setMessage(`${reason instanceof Error ? reason.message : "链接读取失败"}。若网站禁止跨域，请先下载后上传。`);
    } finally { setImportingUrl(false); }
  }

  async function upload(files?: FileList | File[] | null) {
    if (busy) return;
    const selectedFiles = Array.from(files ?? []);
    if (!selectedFiles.length) return;
    const queueIndexes = selectedFiles.map((file) => pendingFiles.indexOf(file));
    const uploadFiles = selectedFiles.map((file, index) => {
      const queueIndex = queueIndexes[index];
      const requestedName = queueIndex >= 0 ? normalizeEditedName(displayNames[queueIndex], file.name) : file.name;
      return requestedName === file.name ? file : new File([file], requestedName, { type: file.type, lastModified: file.lastModified });
    });
    const invalidFiles = uploadFiles
      .map((file) => ({ file, error: validateMediaFileSelection(file) }))
      .filter((item) => item.error);
    if (invalidFiles.length) {
      setHasError(true);
      setMessage(`${invalidFiles[0].file.name}：${invalidFiles[0].error}`);
      return;
    }

    const updateQueue = (selectedIndex: number, patch: Partial<QueueState>) => {
      const queueIndex = queueIndexes[selectedIndex];
      if (queueIndex < 0) return;
      setQueueStates((states) => states.map((state, index) => index === queueIndex ? { ...state, ...patch } : state));
    };
    const saveResult = (selectedIndex: number, result: MediaUploadResult) => {
      const queueIndex = queueIndexes[selectedIndex];
      if (queueIndex < 0) return;
      setUploadedResults(results => results.map((item, index) => index === queueIndex ? result : item));
    };
    if (selectedFiles.length === pendingFiles.length && queueIndexes.every((index) => index >= 0)) {
      setQueueStates(selectedFiles.map(() => ({ status: "waiting", progress: 0 })));
    }

    setBusy(true);
    setHasError(false);
    setProgress(0);
    setOverallProgress(0);
    setPaused(false);
    setResumableActive(false);
    cancelRequested.current = false;
    controller.current = new AbortController();
    let uploaded = 0;
    const failures: string[] = [];
    for (const [index, file] of uploadFiles.entries()) {
      if (cancelRequested.current) break;
      updateQueue(index, { status: "uploading", progress: 0, error: undefined });
      setMessage(`正在上传 ${index + 1}/${selectedFiles.length}：${file.name}`);
      setOverallProgress(Math.round((index / selectedFiles.length) * 100));
      try {
        let result: MediaUploadResult;
        const contentHash = await hashMediaFile(file);
        const duplicateResponse = await fetch(`/api/admin/media/duplicate?hash=${contentHash}`, { cache: "no-store", signal: controller.current.signal });
        const duplicateResult = await duplicateResponse.json().catch(() => null) as { duplicate?: boolean; item?: MediaUploadResult } | null;
        if (duplicateResponse.ok && duplicateResult?.duplicate && duplicateResult.item) {
          result = duplicateResult.item;
          setMessage(`已检测到相同文件，直接使用媒体库中的 ${result.name}`);
        } else if (shouldUseResumableUpload(file)) {
          try {
            result = await uploadResumable(file, {
              signal: controller.current.signal,
              contentHash,
              onUploadReady: (upload) => { currentUpload.current = upload; setResumableActive(true); },
              onProgress: (percentage) => {
                setProgress(percentage);
                updateQueue(index, { status: "uploading", progress: percentage });
                setOverallProgress(Math.round(((index + percentage / 100) / selectedFiles.length) * 100));
                setMessage(`正在断点续传 ${index + 1}/${selectedFiles.length}：${file.name} · ${percentage}%`);
              },
            });
          } catch (reason) {
            if (!(reason instanceof ResumableUploadError && reason.code === "authorization")) throw reason;
            currentUpload.current = null;
            setResumableActive(false);
            setProgress(0);
            setMessage(`断点续传授权不可用，正在安全切换普通上传：${file.name}`);
            result = await uploadStandardMedia(file, controller.current.signal, contentHash);
          }
        } else {
          result = await uploadStandardMedia(file, controller.current.signal, contentHash);
        }
        uploaded += 1;
        updateQueue(index, { status: "success", progress: 100 });
        saveResult(index, result);
        setOverallProgress(Math.round(((index + 1) / selectedFiles.length) * 100));
        onUploaded?.(result);
      } catch (reason) {
        if (cancelRequested.current || (reason instanceof DOMException && reason.name === "AbortError")) {
          updateQueue(index, { status: "cancelled", progress: 0 });
          break;
        }
        const error = reason instanceof Error ? reason.message : "无法连接上传服务";
        updateQueue(index, { status: "failed", progress: 0, error });
        failures.push(`${file.name}：${error}`);
      } finally {
        currentUpload.current = null;
        setResumableActive(false);
        setProgress(0);
        setPaused(false);
      }
    }
    if (cancelRequested.current) {
      setHasError(false);
      setMessage(uploaded ? `上传已取消，已完成 ${uploaded} 个文件。` : "上传已取消，可稍后重新选择文件继续。 ");
      setBusy(false);
      setOverallProgress(0);
      controller.current = null;
      return;
    }
    setHasError(failures.length > 0);
    setMessage(
      failures.length
        ? `成功 ${uploaded} 个，失败 ${failures.length} 个。${failures[0]}`
        : `上传完成，共 ${uploaded} 个文件。`,
    );
    setBusy(false);
    controller.current = null;
  }

  useEffect(() => {
    uploadAction.current = upload;
  });

  useEffect(() => {
    const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;
    const enter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setDragActive(true);
    };
    const over = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    };
    const leave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragActive(false);
    };
    const drop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setDragActive(false);
      if (event.dataTransfer?.files.length) void uploadAction.current(event.dataTransfer.files);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, []);

  function togglePause() {
    const upload = currentUpload.current;
    if (!upload) return;
    if (paused) {
      upload.start();
      setPaused(false);
    } else {
      void upload.abort(false).then(() => setPaused(true));
    }
  }

  function cancelUpload() {
    cancelRequested.current = true;
    controller.current?.abort();
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      {dragActive && !busy && (
        <div className="pointer-events-none fixed inset-0 z-[200] grid place-items-center bg-zinc-950/45 p-6 backdrop-blur-sm">
          <div className="flex w-full max-w-xl flex-col items-center rounded-[28px] border-2 border-dashed border-pink-400 bg-white/95 px-8 py-14 text-center shadow-2xl dark:bg-zinc-900/95">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-pink-500 text-white shadow-lg shadow-pink-500/25">
              <UploadCloud size={30} />
            </span>
            <strong className="mt-5 text-xl">松开即可上传</strong>
            <span className="mt-2 text-sm text-zinc-500">支持批量拖入图片、音频和视频</span>
          </div>
        </div>
      )}
      <div className="relative flex h-11 self-stretch overflow-visible rounded-[14px] bg-rose-500 shadow-sm sm:self-end">
        <button className={`btn-primary h-11 flex-1 !rounded-l-[14px] !rounded-r-none px-[18px] hover:!translate-y-0 sm:flex-none ${busy ? "cursor-wait opacity-70" : "cursor-pointer"}`} disabled={busy} onClick={() => setDialogOpen(true)} type="button">{busy ? <LoaderCircle className="animate-spin" size={15} /> : <UploadIcon size={15} />}{busy ? "上传中…" : "上传媒体"}</button>
        <button aria-expanded={menuOpen} aria-label="打开上传菜单" className="btn-primary h-11 !w-11 !rounded-l-none !rounded-r-[14px] border-l border-white/25 !px-0 hover:!translate-y-0" disabled={busy} onClick={() => setMenuOpen(value=>!value)} type="button"><ChevronDown className={menuOpen ? "rotate-180 transition" : "transition"} size={15}/></button>
        {menuOpen && <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border border-black/5 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900">
          <MenuButton icon={<UploadIcon size={14}/>} label="上传文件" onClick={()=>{setMenuOpen(false);fileInput.current?.click();}}/>
          <MenuButton icon={<FolderUp size={14}/>} label="上传文件夹" onClick={()=>{setMenuOpen(false);folderInput.current?.click();}}/>
          <MenuButton icon={<Link2 size={14}/>} label="从链接导入" onClick={()=>{setMenuOpen(false);setDialogOpen(true);}}/>
          <MenuButton icon={<ListChecks size={14}/>} label="查看上传任务" onClick={()=>{setMenuOpen(false);setDialogOpen(true);}}/>
        </div>}
      </div>
      <input accept={MEDIA_FILE_ACCEPT} className="sr-only" multiple onChange={event=>{selectFiles(Array.from(event.target.files??[]));event.target.value="";}} ref={fileInput} type="file"/>
      <input accept={MEDIA_FILE_ACCEPT} className="sr-only" multiple onChange={event=>{selectFiles(Array.from(event.target.files??[]));event.target.value="";}} ref={node=>{folderInput.current=node;if(node)node.setAttribute("webkitdirectory","");}} type="file"/>
      {!busy && <span className="text-center text-[11px] text-zinc-400 sm:text-right">支持拖拽上传</span>}
      {message && (
        <p
          aria-live="polite"
          className={`max-w-sm text-right text-xs leading-5 ${hasError ? "text-red-500" : "text-zinc-500"}`}
        >
          {message}
        </p>
      )}
      {busy && (
        <div className="flex items-center gap-2 text-xs">
          {resumableActive && (
            <button className="inline-flex items-center gap-1 font-bold text-zinc-500 hover:text-pink-500" onClick={togglePause} type="button">
              {paused ? <Play size={13} /> : <Pause size={13} />}
              {paused ? "继续" : "暂停"}
            </button>
          )}
          <button className="inline-flex items-center gap-1 font-bold text-red-500" onClick={cancelUpload} type="button">
            <X size={13} />取消
          </button>
          {progress > 0 && <span className="text-zinc-400">{progress}%</span>}
        </div>
      )}
      {dialogOpen && (
        <div aria-label="上传媒体" aria-modal="true" className="fixed inset-0 z-[190] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" role="dialog">
          <section className="panel w-full max-w-2xl overflow-hidden">
            <header className="flex items-start justify-between border-b border-black/5 p-5 dark:border-white/10">
              <div>
                <h2 className="text-xl font-black">上传媒体</h2>
                <p className="mt-1 text-xs text-zinc-500">可一次选择多个文件，并按顺序上传。</p>
              </div>
              <button aria-label="关闭上传面板" className="grid h-9 w-9 place-items-center rounded-full bg-black/5 dark:bg-white/5" disabled={busy} onClick={() => setDialogOpen(false)} type="button"><X size={16} /></button>
            </header>
            <div className="space-y-4 p-5">
              <div className="flex gap-2">
                <input aria-label="媒体链接" className="field min-w-0 flex-1" disabled={busy||importingUrl} onChange={event=>setUrlInput(event.target.value)} placeholder="粘贴图片、音频或视频链接…" type="url" value={urlInput}/>
                <button className="page-btn shrink-0" disabled={!urlInput||busy||importingUrl} onClick={()=>void importFromUrl()} type="button">{importingUrl?"读取中…":"导入链接"}</button>
              </div>
              <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/50 px-5 py-7 text-center transition hover:border-pink-400 dark:border-pink-500/20 dark:bg-pink-500/5">
                <UploadCloud className="text-pink-500" size={28} />
                <strong className="mt-2 text-sm">选择图片、音频或视频</strong>
                <span className="mt-1 text-xs text-zinc-500">支持批量选择，也可以把文件拖到页面</span>
                <input accept={MEDIA_FILE_ACCEPT} className="sr-only" disabled={busy} multiple onChange={(event) => {selectFiles(Array.from(event.target.files??[]));event.target.value="";}} type="file" />
              </label>
              <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500">
                <span className="tag-pill">图片：JPG / PNG / WebP / GIF / AVIF，最大 8MB</span>
                <span className="tag-pill">音视频：MP3 / WAV / OGG / MP4 / WebM，最大 50MB</span>
              </div>
              {pendingFiles.length > 0 && (
                <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl bg-black/[.025] p-2 dark:bg-white/[.035]">
                  {pendingFiles.map((file, index) => {
                    const state = queueStates[index] ?? { status: "waiting", progress: 0 };
                    const uploadedResult = uploadedResults[index];
                    return (
                    <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 dark:bg-zinc-900" key={`${file.name}-${file.size}-${index}`}>
                      <FilePreview file={file} status={state.status} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <input aria-label={`${file.name} 的显示文件名`} className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-bold outline-none focus:text-pink-500" disabled={busy || state.status === "success"} maxLength={180} onChange={(event) => setDisplayNames(names => names.map((name, itemIndex) => itemIndex === index ? event.target.value : name))} value={displayNames[index] ?? file.name} />
                          <QueueLabel state={state} />
                        </div>
                        <span className="text-[11px] text-zinc-400">{formatFileSize(file.size)}{state.error ? ` · ${state.error}` : ""}</span>
                        {state.status === "uploading" && <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10"><div className="h-full bg-pink-500 transition-[width]" style={{width:`${state.progress}%`}} /></div>}
                        {state.status === "success" && uploadedResult && <SuccessActions result={uploadedResult} />}
                      </div>
                      {!busy && state.status === "failed" && <button aria-label={`重试 ${file.name}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10" onClick={() => void upload([file])} type="button"><RotateCcw size={12} />重试</button>}
                      {!busy && state.status !== "success" && <button aria-label={`移除 ${file.name}`} className="p-2 text-zinc-400 hover:text-red-500" onClick={() => {setPendingFiles(files => files.filter((_, itemIndex) => itemIndex !== index));setDisplayNames(names => names.filter((_, itemIndex) => itemIndex !== index));setQueueStates(states => states.filter((_, itemIndex) => itemIndex !== index));setUploadedResults(results => results.filter((_, itemIndex) => itemIndex !== index));}} type="button"><X size={14} /></button>}
                    </div>
                  );})}
                </div>
              )}
              {busy && (
                <div>
                  <div className="mb-1.5 flex justify-between text-xs font-bold"><span>总体进度</span><span>{overallProgress}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10"><div className="h-full rounded-full bg-pink-500 transition-[width]" style={{width:`${overallProgress}%`}} /></div>
                  <div className="mt-3 flex items-center justify-end gap-3 text-xs">
                    {resumableActive && <button className="inline-flex items-center gap-1 font-bold text-zinc-500 hover:text-pink-500" onClick={togglePause} type="button">{paused ? <Play size={13}/> : <Pause size={13}/>} {paused ? "继续" : "暂停"}</button>}
                    <button className="inline-flex items-center gap-1 font-bold text-red-500" onClick={cancelUpload} type="button"><X size={13}/>取消上传</button>
                  </div>
                </div>
              )}
              {message && <p aria-live="polite" className={`text-xs leading-5 ${hasError ? "text-red-500" : "text-zinc-500"}`}>{message}</p>}
              <footer className="flex justify-end gap-2">
                {!busy && queueStates.some(state=>state.status==="success") && <button className="page-btn" onClick={() => {const keep=queueStates.map((state,index)=>({state,index})).filter(item=>item.state.status!=="success").map(item=>item.index);setPendingFiles(files=>keep.map(index=>files[index]));setDisplayNames(names=>keep.map(index=>names[index]));setQueueStates(states=>keep.map(index=>states[index]));setUploadedResults(results=>keep.map(index=>results[index]));}} type="button">清理已完成</button>}
                <button className="page-btn" disabled={busy} onClick={() => setDialogOpen(false)} type="button">取消</button>
                <button className="btn-primary" disabled={busy || pendingFiles.length === 0} onClick={() => void upload(pendingFiles)} type="button">{busy ? "上传中…" : `开始上传 ${pendingFiles.length || ""}`}</button>
              </footer>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function normalizeEditedName(value: string | undefined, originalName: string) {
  const originalExtension = originalName.match(/\.[^.]+$/)?.[0] ?? "";
  const clean = String(value ?? originalName).replace(/[\\/\u0000-\u001f\u007f]/g, "_").trim();
  if (!clean) return originalName;
  const withoutExtension = clean.replace(/\.[^.]+$/, "");
  return `${withoutExtension || "media"}${originalExtension}`;
}

function FilePreview({ file, status }: { file: File; status: QueueStatus }) {
  const [duration, setDuration] = useState(0);
  const kind = getMediaKind(file.type, file.name);
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  const badge = duration > 0 ? <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[9px] font-bold text-white">{formatDuration(duration)}</span> : null;
  if (kind === "image") return <span className="relative h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-white/5">{url ? <span aria-label="图片预览" className="block h-full w-full bg-cover bg-center" role="img" style={{backgroundImage:`url(${url})`}}/> : <ImageIcon className="m-auto mt-4 text-zinc-400" size={16}/>}<StatusDot status={status}/></span>;
  if (kind === "video") return <span className="relative h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-900">{url ? <video className="h-full w-full object-cover" muted onLoadedMetadata={(event)=>setDuration(event.currentTarget.duration)} preload="metadata" src={url}/> : <Video className="m-auto mt-4 text-white/60" size={17}/>} {badge}<StatusDot status={status}/></span>;
  return <span className="relative grid h-12 w-14 shrink-0 place-items-center rounded-lg bg-pink-500/10 text-pink-500"><Music size={20}/>{url && <audio onLoadedMetadata={(event)=>setDuration(event.currentTarget.duration)} preload="metadata" src={url}/>} {badge}<StatusDot status={status}/></span>;
}

function StatusDot({ status }: { status: QueueStatus }) {
  if (status === "waiting") return null;
  const color = status === "success" ? "bg-emerald-500" : status === "uploading" ? "bg-pink-500" : "bg-red-500";
  return <span className={`absolute right-1 top-1 h-2 w-2 rounded-full ring-2 ring-white ${color}`}/>;
}

function formatDuration(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2,"0")}`;
}

function SuccessActions({ result }: { result: MediaUploadResult }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }
  const className = "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold text-zinc-500 hover:bg-pink-50 hover:text-pink-500 dark:hover:bg-pink-500/10";
  return <div className="mt-1 flex flex-wrap items-center gap-1">
    <button className={className} onClick={() => void copy()} type="button"><Copy size={10}/>{copied ? "已复制" : "复制链接"}</button>
    <a className={className} href={result.url} rel="noreferrer" target="_blank"><ExternalLink size={10}/>查看媒体</a>
    <Link className={className} href="/admin/articles/new"><FilePlus2 size={10}/>去写文章</Link>
  </div>;
}

function MenuButton({icon,label,onClick}:{icon:React.ReactNode;label:string;onClick:()=>void}) {
  return <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-zinc-600 hover:bg-pink-50 hover:text-pink-500 dark:text-zinc-300 dark:hover:bg-pink-500/10" onClick={onClick} type="button">{icon}{label}</button>;
}

function QueueLabel({ state }: { state: QueueState }) {
  const labels: Record<QueueStatus, string> = {waiting:"等待上传",uploading:`上传中 ${state.progress}%`,success:"上传成功",failed:"上传失败",cancelled:"已取消"};
  const color = state.status === "success" ? "text-emerald-600" : state.status === "failed" || state.status === "cancelled" ? "text-red-500" : state.status === "uploading" ? "text-pink-500" : "text-zinc-400";
  return <span className={`shrink-0 text-[11px] font-bold ${color}`}>{labels[state.status]}</span>;
}
