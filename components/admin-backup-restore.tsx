"use client";

import { CheckCircle2, Database, FileJson, FileUp, LoaderCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";

type Preview = { ok?: boolean; version?: number; counts?: Record<string, number>; error?: string };
const countLabels: Record<string, string> = { articles: "文章", moments: "动态", comments: "评论", categories: "分类", carousel: "轮播", media: "媒体", settings: "设置" };

export function AdminBackupRestore() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function request(previewOnly: boolean) {
    if (!file) return;
    setBusy(true); setMessage("");
    try {
      const text = await file.text();
      const response = await fetch(`/api/admin/import${previewOnly ? "?preview=1" : ""}`, { method: "POST", headers: { "content-type": "application/json", ...(previewOnly ? {} : { "x-confirm-restore": "MERGE" }) }, body: text });
      const value = await response.json() as Preview;
      if (!response.ok) { setMessage(value.error ?? "备份处理失败"); return; }
      if (previewOnly) { setPreview(value); setMessage("备份验证通过，可以安全合并。 "); }
      else { setMessage("备份恢复完成，请刷新相关后台页面检查数据。 "); }
    } catch { setMessage("无法读取或处理备份文件"); }
    finally { setBusy(false); }
  }
  async function restore() {
    if (!preview || !window.confirm("确认把备份数据合并到当前数据库吗？现有数据不会被清空，但相同记录可能被更新。")) return;
    await request(false);
  }
  function choose(selected: File | null) {
    if (selected && selected.size > 5 * 1024 * 1024) { setMessage("备份文件不能超过 5MB"); setFile(null); return; }
    setFile(selected); setPreview(null); setMessage("");
  }

  return <section className="panel overflow-hidden p-5 sm:p-6">
    <header className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-500"><RotateCcw size={20}/></span>
      <div><h3 className="font-black">合并恢复备份</h3><p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">验证 JSON 备份后，将内容与媒体清单安全合并到当前数据库；不会清空现有记录，也不会删除已上传文件。</p></div>
    </header>

    <div className="mt-5 grid gap-3 lg:grid-cols-3">
      <StepCard active={!file} done={Boolean(file)} icon={<FileUp size={16}/>} step="01" title="选择备份文件">
        <label className="page-btn mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 !rounded-xl"><FileJson size={15}/><span className="max-w-[210px] truncate">{file ? file.name : "选择 JSON 备份"}</span><input accept="application/json,.json" className="sr-only" onChange={event=>choose(event.target.files?.[0]??null)} type="file"/></label>
        <p className="mt-2 text-[11px] text-zinc-400">仅支持 JSON，最大 5MB{file ? ` · ${formatSize(file.size)}` : ""}</p>
      </StepCard>
      <StepCard active={Boolean(file && !preview)} done={Boolean(preview)} icon={<ShieldCheck size={16}/>} step="02" title="验证内容">
        <button className="page-btn mt-4 min-h-10 w-full justify-center gap-2 !rounded-xl px-5 disabled:cursor-not-allowed disabled:border-dashed disabled:bg-zinc-50/70 disabled:text-zinc-400 disabled:opacity-70 sm:w-auto dark:disabled:bg-white/[.025]" disabled={!file||busy} onClick={()=>void request(true)} type="button">{busy?<LoaderCircle className="animate-spin" size={14}/>:<ShieldCheck size={14}/>}验证并预览</button>
        <p className="mt-2 text-[11px] text-zinc-400">检查文件结构、版本与记录数量</p>
      </StepCard>
      <StepCard active={Boolean(preview)} done={message.includes("恢复完成")} danger icon={<Database size={16}/>} step="03" title="确认合并">
        <button className="btn-primary mt-4 min-h-10 w-full justify-center gap-2 !rounded-xl px-5 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 disabled:opacity-70 sm:w-auto dark:disabled:bg-white/10" disabled={!preview||busy} onClick={()=>void restore()} type="button"><Database size={14}/>确认合并恢复</button>
        <p className="mt-2 text-[11px] text-zinc-400">执行前还会进行一次安全确认</p>
      </StepCard>
    </div>

    {preview?.counts && <div className="mt-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4"><div className="flex items-center gap-2 text-xs font-black text-emerald-600"><CheckCircle2 size={15}/>验证通过 · 备份版本 {preview.version ?? "—"}</div><div className="mt-3 flex flex-wrap gap-2">{Object.entries(preview.counts).map(([key,count])=><span className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-zinc-600 shadow-sm dark:bg-zinc-900 dark:text-zinc-300" key={key}>{countLabels[key]??key} · {count}</span>)}</div></div>}
    {message && <p aria-live="polite" className={`mt-4 rounded-xl px-3 py-2.5 text-xs ${message.includes("失败")||message.includes("不能")||message.includes("无法") ? "bg-red-500/5 text-red-500" : "bg-emerald-500/5 text-emerald-600"}`}>{message}</p>}
  </section>;
}

function StepCard({ step, title, icon, active, done, danger=false, children }: { step:string; title:string; icon:React.ReactNode; active:boolean; done:boolean; danger?:boolean; children:React.ReactNode }) {
  const accent = done ? "border-emerald-500/20 bg-emerald-500/[.035]" : active ? danger ? "border-rose-300 bg-rose-500/[.025]" : "border-violet-300 bg-violet-500/[.025]" : "border-black/5 bg-black/[.01] dark:border-white/5 dark:bg-white/[.015]";
  return <div className={`rounded-2xl border p-4 transition ${accent}`}><div className="flex items-center gap-2.5"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${done ? "bg-emerald-500/10 text-emerald-600" : danger ? "bg-rose-500/10 text-rose-500" : "bg-violet-500/10 text-violet-500"}`}>{done?<CheckCircle2 size={16}/>:icon}</span><b className="min-w-0 flex-1 text-sm">{title}</b><span className="shrink-0 text-[10px] font-black tracking-[.12em] text-zinc-300">STEP {step}</span></div>{children}</div>;
}

function formatSize(size:number) { return size < 1024*1024 ? `${Math.max(1,Math.round(size/1024))}KB` : `${(size/1024/1024).toFixed(1)}MB`; }
