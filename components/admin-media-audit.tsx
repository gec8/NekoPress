"use client";

import { Activity, CheckCircle2, CloudOff, Database, FileQuestion, LoaderCircle, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminRole } from "@/components/admin-permissions";

type Result = { ok?: boolean; total?: number; unindexed?: number; missing?: number; interrupted?: number; repaired?: number; error?: string };

export function AdminMediaAudit() {
  const role = useAdminRole();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  async function run(repair = false) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/media/audit", { method: repair ? "POST" : "GET", cache: "no-store" });
      const value = await response.json() as Result;
      setResult(value);
      if (response.ok && repair) { router.refresh(); window.setTimeout(() => void run(false), 500); }
    } catch { setResult({ error: "无法连接媒体检查服务" }); }
    finally { setBusy(false); }
  }
  const issues = (result?.unindexed ?? 0) + (result?.missing ?? 0) + (result?.interrupted ?? 0);
  const healthy = Boolean(result?.ok && issues === 0);

  return <section className="panel mt-5 overflow-hidden p-4 sm:p-5">
    <div className="grid gap-4 xl:grid-cols-[minmax(220px,.8fr)_minmax(480px,1.5fr)_auto] xl:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-pink-500/10 text-pink-500"><Activity size={18}/></span>
          <div><b className="block text-sm">媒体一致性检查</b><span className="text-[11px] text-zinc-400">Storage 与媒体索引状态</span></div>
          {result?.ok && <span className={`ml-1 rounded-full px-2 py-1 text-[10px] font-black ${healthy ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>{healthy ? "状态正常" : `${issues} 项待处理`}</span>}
        </div>
        {!result && <p className="mt-2 text-xs text-zinc-500">仅在点击时连接 Storage，不影响日常页面速度。</p>}
        {result?.error && <p className="mt-2 text-xs text-red-500">{result.error}</p>}
      </div>
      {result?.ok ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric icon={<Database size={14}/>} label="文件总数" value={result.total ?? 0}/>
        <Metric icon={<FileQuestion size={14}/>} label="未建索引" value={result.unindexed ?? 0} warning={Boolean(result.unindexed)}/>
        <Metric icon={<CloudOff size={14}/>} label="文件丢失" value={result.missing ?? 0} warning={Boolean(result.missing)}/>
        <Metric icon={<Activity size={14}/>} label="上传中断" value={result.interrupted ?? 0} warning={Boolean(result.interrupted)}/>
      </div> : <div className="hidden h-px bg-black/5 xl:block dark:bg-white/10"/>}
      <div className="flex flex-wrap justify-end gap-2">
        <button className="page-btn min-h-11 gap-2 !rounded-xl" disabled={busy} onClick={() => void run(false)} type="button">{busy ? <LoaderCircle className="animate-spin" size={14}/> : healthy ? <CheckCircle2 size={14}/> : <Activity size={14}/>} {result ? "重新检查" : "立即检查"}</button>
        {role === "admin" && issues > 0 && <button className="btn-primary min-h-11 gap-2 !rounded-xl" disabled={busy} onClick={() => void run(true)} type="button"><Wrench size={14}/>安全修复</button>}
      </div>
    </div>
  </section>;
}

function Metric({ icon, label, value, warning = false }: { icon: React.ReactNode; label: string; value: number; warning?: boolean }) {
  return <div className={`rounded-xl border px-3 py-2.5 ${warning ? "border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/5" : "border-black/5 bg-black/[.02] dark:border-white/5 dark:bg-white/[.025]"}`}><div className={`flex items-center gap-1.5 text-[10px] ${warning ? "text-amber-600" : "text-zinc-400"}`}>{icon}{label}</div><b className={`mt-1 block text-lg leading-none ${warning ? "text-amber-600" : "text-zinc-800 dark:text-zinc-100"}`}>{value}</b></div>;
}
