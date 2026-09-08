"use client";

import { Check, Copy, FileAudio, FileImage, FileVideo, Play, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminMediaDelete } from "@/components/admin-media-delete";
import { useAdminRole } from "@/components/admin-permissions";
import { SafeImage } from "@/components/safe-image";
import type { AdminMediaItem } from "@/lib/admin-data";
import { getMediaKind, getMediaKindLabel } from "@/lib/media-types";

type MediaFilter = "all" | "image" | "audio" | "video";
type UsageFilter="all"|"used"|"unused";
type MediaSort="newest"|"oldest"|"largest"|"name";
const MEDIA_PAGE_SIZE=18;

const filters: Array<{ key: MediaFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "image", label: "图片" },
  { key: "audio", label: "音频" },
  { key: "video", label: "视频" },
];

function getMediaType(item: AdminMediaItem): Exclude<MediaFilter, "all"> {
  return getMediaKind(item.mime, item.path);
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function MediaCard({ item, onDeleted }: { item: AdminMediaItem; onDeleted: (path: string) => void }) {
  const type = getMediaType(item);
  const [details, setDetails] = useState(item.width&&item.height?`${item.width} × ${item.height}`:item.duration?formatDuration(item.duration):"");
  const [previewActive,setPreviewActive]=useState(false);
  const typeLabel = getMediaKindLabel(type);
  const TypeIcon = type === "image" ? FileImage : type === "audio" ? FileAudio : FileVideo;
  function rememberMetadata(values:{width?:number;height?:number;duration?:number}){
    void fetch("/api/admin/media",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({path:item.path,...values})});
  }

  return (
    <article className="panel overflow-hidden">
      <div className="relative grid aspect-[4/3] place-items-center bg-black/5 dark:bg-white/5">
        {type === "image" ? (
          <SafeImage
            alt={item.name}
            className="object-cover"
            fill
            onLoad={(event) => {
              const image = event.currentTarget;
              setDetails(`${image.naturalWidth} × ${image.naturalHeight}`);
            }}
            sizes="(max-width:640px) 100vw, 33vw"
            src={item.url}
          />
        ) : type === "video" ? (
          previewActive ? <video
              autoPlay
              className="h-full w-full bg-black object-contain"
              controls
              onLoadedMetadata={(event) => {const duration=event.currentTarget.duration;setDetails(formatDuration(duration));if(!item.duration)rememberMetadata({duration});}}
              preload="metadata"
              src={item.url}
            /> : <button className="grid h-full w-full place-items-center bg-gradient-to-br from-zinc-800 to-black text-white" onClick={()=>setPreviewActive(true)} type="button"><span className="grid h-14 w-14 place-items-center rounded-full bg-white/15 backdrop-blur"><Play className="ml-1" fill="currentColor" size={24}/></span><span className="sr-only">加载并预览视频 {item.name}</span></button>
        ) : (
          <div className="w-full px-5 text-center">
            <FileAudio className="mx-auto mb-5 text-pink-500" size={42} />
            <audio
              className="w-full"
              controls
              onLoadedMetadata={(event) => {const duration=event.currentTarget.duration;setDetails(formatDuration(duration));if(!item.duration)rememberMetadata({duration});}}
              preload="none"
              src={item.url}
            />
          </div>
        )}
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
          <TypeIcon size={13} />
          {typeLabel}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-xs font-bold" title={item.name}>{item.name}</p>
          <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${item.usageCount ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>
            {item.usageCount ? `使用中 · ${item.usageCount} 处` : "未使用"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-zinc-400">
          {item.mime || "媒体文件"} · {(item.size / 1024 / 1024).toFixed(1)} MB
          {details ? ` · ${details}` : ""} · {item.createdAt.slice(0, 10)}
        </p>
        <input
          aria-label="媒体地址"
          className="mt-3 w-full rounded-lg bg-black/5 px-2 py-1.5 text-[10px] text-zinc-500 outline-none dark:bg-white/5"
          readOnly
          value={item.url}
        />
        <AdminMediaDelete onDeleted={onDeleted} path={item.path} />
      </div>
    </article>
  );
}

export function AdminMediaLibrary({ items, onItemsChange }: { items: AdminMediaItem[]; onItemsChange: (items: AdminMediaItem[]) => void }) {
  const role = useAdminRole();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<MediaFilter>("all");
  const [usageFilter,setUsageFilter]=useState<UsageFilter>("all");
  const [sort,setSort]=useState<MediaSort>("newest");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [copiedPath, setCopiedPath] = useState("");
  const [visibleLimit,setVisibleLimit]=useState(MEDIA_PAGE_SIZE);
  const counts = useMemo(
    () => ({
      all: items.length,
      image: items.filter((item) => getMediaType(item) === "image").length,
      audio: items.filter((item) => getMediaType(item) === "audio").length,
      video: items.filter((item) => getMediaType(item) === "video").length,
    }),
    [items],
  );
  const summary=useMemo(()=>({size:items.reduce((total,item)=>total+item.size,0),used:items.filter(item=>Boolean(item.usageCount)).length,unused:items.filter(item=>!item.usageCount).length}),[items]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredItems = items.filter(
    (item) =>
      (activeFilter === "all" || getMediaType(item) === activeFilter) &&
      (usageFilter==="all"||(usageFilter==="used"?Boolean(item.usageCount):!item.usageCount))&&
      (!normalizedQuery || item.name.toLocaleLowerCase().includes(normalizedQuery)),
  ).sort((a,b)=>sort==="oldest"?a.createdAt.localeCompare(b.createdAt):sort==="largest"?b.size-a.size:sort==="name"?a.name.localeCompare(b.name,"zh-CN"):b.createdAt.localeCompare(a.createdAt));
  const visibleItems=filteredItems.slice(0,visibleLimit);
  const selectedVisibleCount = visibleItems.filter((item) => selected.has(item.path)).length;
  const allVisibleSelected = visibleItems.length > 0 && selectedVisibleCount === visibleItems.length;

  function toggleSelection(path: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
    setMessage("");
  }

  function toggleVisibleSelection() {
    setSelected((current) => {
      const next = new Set(current);
      visibleItems.forEach((item) => {
        if (allVisibleSelected) next.delete(item.path);
        else next.add(item.path);
      });
      return next;
    });
  }

  async function copyUrl(item: AdminMediaItem) {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedPath(item.path);
      window.setTimeout(() => setCopiedPath(""), 1800);
    } catch {
      setMessage("复制链接失败，请手动复制媒体地址。");
    }
  }

  async function deleteSelected() {
    if (!selected.size || !window.confirm(`确定删除选中的 ${selected.size} 个媒体吗？此操作不可恢复。`)) return;
    setBusy(true);
    setMessage("");
    const targets = items.filter((item) => selected.has(item.path));
    const results = await Promise.all(
      targets.map(async (item) => {
        try {
          const response = await fetch(`/api/admin/media?path=${encodeURIComponent(item.path)}`, {
            method: "DELETE",
          });
          const result = await response.json();
          return { item, ok: response.ok, error: String(result.error ?? "删除失败") };
        } catch {
          return { item, ok: false, error: "无法连接删除服务" };
        }
      }),
    );
    const failures = results.filter((result) => !result.ok);
    const deletedPaths = new Set(results.filter((result) => result.ok).map((result) => result.item.path));
    onItemsChange(items.filter((item) => !deletedPaths.has(item.path)));
    setSelected(new Set(failures.map((result) => result.item.path)));
    setMessage(
      failures.length
        ? `已删除 ${results.length - failures.length} 个，${failures.length} 个未删除：${failures[0].error}`
        : `已删除 ${results.length} 个媒体。`,
    );
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="panel p-4"><p className="text-xs text-zinc-400">媒体总容量</p><b className="mt-1 block text-xl">{(summary.size/1024/1024).toFixed(1)} MB</b></div>
        <div className="panel p-4"><p className="text-xs text-zinc-400">正在使用</p><b className="mt-1 block text-xl text-amber-600">{summary.used} 个</b></div>
        <div className="panel p-4"><p className="text-xs text-zinc-400">可以检查清理</p><b className="mt-1 block text-xl text-emerald-600">{summary.unused} 个</b></div>
      </div>
      <div
        aria-label="媒体类型筛选"
        className="panel flex gap-2 overflow-x-auto p-2"
        role="group"
      >
        {filters.map((filter) => {
          const active = activeFilter === filter.key;
          return (
            <button
              aria-pressed={active}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${
                active
                  ? "bg-pink-500 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-black/5 hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-white"
              }`}
              key={filter.key}
              onClick={() => {setActiveFilter(filter.key);setVisibleLimit(MEDIA_PAGE_SIZE);}}
              type="button"
            >
              {filter.label}
              <span className={`ml-2 text-xs ${active ? "text-white/80" : "text-zinc-400"}`}>
                {counts[filter.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="panel mt-4 grid gap-3 p-3 md:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_160px_160px_auto] lg:items-center">
        <label className="relative min-w-0 md:col-span-2 lg:col-span-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            size={17}
          />
          <span className="sr-only">搜索媒体文件名</span>
          <input
            className="w-full rounded-xl border border-black/5 bg-black/[.025] py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-pink-400 dark:border-white/10 dark:bg-white/5"
            onChange={(event) => {setQuery(event.target.value);setVisibleLimit(MEDIA_PAGE_SIZE);}}
            placeholder="搜索媒体文件名…"
            type="search"
            value={query}
          />
        </label>
        <select aria-label="媒体使用状态" className="field min-w-0 lg:!w-40" onChange={event=>{setUsageFilter(event.target.value as UsageFilter);setVisibleLimit(MEDIA_PAGE_SIZE);}} value={usageFilter}>
          <option value="all">全部用途</option><option value="used">使用中</option><option value="unused">未使用</option>
        </select>
        <select aria-label="媒体排序" className="field min-w-0 lg:!w-40" onChange={event=>{setSort(event.target.value as MediaSort);setVisibleLimit(MEDIA_PAGE_SIZE);}} value={sort}>
          <option value="newest">最新上传</option><option value="oldest">最早上传</option><option value="largest">文件最大</option><option value="name">按文件名</option>
        </select>
        {role === "admin" && (
          <div className="flex items-center justify-end gap-2 md:col-span-2 lg:col-span-1">
            <button
              className="min-h-11 whitespace-nowrap rounded-xl border border-black/10 px-3 py-2 text-xs font-bold text-zinc-600 transition hover:border-pink-300 hover:text-pink-500 dark:border-white/10 dark:text-zinc-300"
              disabled={!visibleItems.length}
              onClick={toggleVisibleSelection}
              type="button"
            >
              {allVisibleSelected ? "取消全选" : "全选当前"}
            </button>
            <button
              className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-xl bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={busy || selected.size === 0}
              onClick={() => void deleteSelected()}
              type="button"
            >
              <Trash2 size={14} />
              {busy ? "删除中…" : `删除所选 ${selected.size}`}
            </button>
          </div>
        )}
      </div>
      {message && (
        <p aria-live="polite" className="mt-3 text-xs leading-5 text-red-500">
          {message}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleItems.length === 0 && (
          <div className="panel col-span-full p-8 text-center text-sm text-zinc-500">
            {items.length === 0 ? "媒体库还是空的，上传第一个文件吧。" : "当前分类暂无媒体。"}
          </div>
        )}
        {visibleItems.map((item) => (
          <div className="relative" key={item.path}>
            {role === "admin" && (
              <label className="absolute right-3 top-3 z-10 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur dark:bg-zinc-900/90">
                <span className="sr-only">选择 {item.name}</span>
                <input
                  checked={selected.has(item.path)}
                  className="peer sr-only"
                  onChange={() => toggleSelection(item.path)}
                  type="checkbox"
                />
                <span className="grid h-4 w-4 place-items-center rounded border border-zinc-400 text-transparent peer-checked:border-pink-500 peer-checked:bg-pink-500 peer-checked:text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
              </label>
            )}
            <MediaCard
              item={item}
              onDeleted={(path) => onItemsChange(items.filter((entry) => entry.path !== path))}
            />
            <button
              className="absolute bottom-4 right-4 inline-flex items-center gap-1 text-xs font-bold text-zinc-400 transition hover:text-pink-500"
              onClick={() => void copyUrl(item)}
              type="button"
            >
              {copiedPath === item.path ? <Check size={13} /> : <Copy size={13} />}
              {copiedPath === item.path ? "已复制" : "复制链接"}
            </button>
          </div>
        ))}
      </div>
      {visibleItems.length<filteredItems.length&&<div className="mt-6 text-center"><button className="page-btn" onClick={()=>setVisibleLimit(value=>value+MEDIA_PAGE_SIZE)} type="button">加载更多（已显示 {visibleItems.length}/{filteredItems.length}）</button></div>}
    </div>
  );
}
