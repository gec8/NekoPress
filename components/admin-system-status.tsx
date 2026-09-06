"use client";

import { AlertTriangle, CheckCircle2, Clock3, DatabaseBackup, Download, HardDrive, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Check={ok:boolean;latencyMs:number;message:string;skipped?:boolean};
type Payload={ok:boolean;kind:string;message:string;latencyMs:number;checkedAt:string;runtime?:{node:string;environment:string;storageBucket:string};checks?:Record<string,Check>};

const labels:Record<string,{label:string;description:string}>={authentication:{label:"登录权限",description:"确认当前会话和后台角色有效"},database:{label:"数据库",description:"确认内容与设置可以正常读取"},storage:{label:"媒体存储",description:"仅在手动完整检测时连接 Storage"},migration:{label:"数据迁移",description:"确认回收站和历史版本已启用"}};

export function AdminSystemStatus(){
  const [data,setData]=useState<Payload|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const check=useCallback(async(includeStorage=false)=>{
    setLoading(true);setError("");
    try{const response=await fetch(`/api/admin/health?mode=${includeStorage?"full":"system"}`,{cache:"no-store"});const payload=await response.json() as Payload;if(!response.ok&&!payload.checks)throw new Error(payload.message||"系统检测失败");setData(payload)}
    catch(reason){setError(reason instanceof Error?reason.message:"无法连接检测服务")}
    finally{setLoading(false)}
  },[]);
  useEffect(()=>{const timer=window.setTimeout(()=>void check(false),0);return()=>window.clearTimeout(timer)},[check]);
  return <div className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-pink-500">System</p><h2 className="mt-1 text-2xl font-black">系统状态</h2><p className="mt-1 text-sm text-zinc-500">自动检查登录与数据库；Storage 仅手动检测。</p></div><button type="button" onClick={()=>void check(true)} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black dark:border-white/10 dark:bg-white/5"><RefreshCw size={15} className={loading?"animate-spin":""}/>手动完整检测</button></header>
    {error&&<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
    {data&&<><section className={`panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center ${data.ok?"":"border-red-200 dark:border-red-500/20"}`}><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${data.kind==="healthy"?"bg-emerald-500/10 text-emerald-600":"bg-amber-500/10 text-amber-600"}`}>{data.kind==="healthy"?<ShieldCheck size={24}/>:<AlertTriangle size={24}/>}</span><div className="min-w-0 flex-1"><h3 className="font-black">{data.message}</h3><p className="mt-1 text-xs text-zinc-500">总响应 {data.latencyMs}ms · 检测于 {new Date(data.checkedAt).toLocaleString("zh-CN")}</p></div>{data.runtime&&<div className="text-xs leading-6 text-zinc-400 sm:text-right"><p>环境：{data.runtime.environment}</p><p>Node：{data.runtime.node}</p></div>}</section>
    <div className="grid gap-4 sm:grid-cols-2">{Object.entries(data.checks??{}).map(([key,item])=><section className="panel p-5" key={key}><div className="flex items-start gap-3">{item.skipped?<Clock3 className="mt-0.5 shrink-0 text-zinc-400" size={20}/>:item.ok?<CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={20}/>:<AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={20}/>}<div><h3 className="font-black">{labels[key]?.label??key}</h3><p className="mt-1 text-xs text-zinc-400">{labels[key]?.description}</p><p className={`mt-3 text-sm font-bold ${item.skipped?"text-zinc-500":item.ok?"text-emerald-600":"text-amber-600"}`}>{item.message}</p>{!item.skipped&&<p className="mt-1 text-xs text-zinc-400">耗时 {item.latencyMs}ms</p>}</div></div></section>)}</div></>}
    <section className="panel p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><div className="flex flex-1 items-start gap-3"><DatabaseBackup className="mt-0.5 text-blue-500" size={22}/><div><h3 className="font-black">内容备份</h3><p className="mt-1 text-sm text-zinc-500">导出文章、动态、分类、轮播和网站设置，不包含账号、评论、密钥或图片文件。</p></div></div><a href="/api/admin/export" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white"><Download size={15}/>导出 JSON 备份</a></div><div className="mt-5 grid gap-3 md:grid-cols-3"><BackupItem title="内容数据" text="重大修改前下载 JSON 备份，并保存到网站服务器之外。"/><BackupItem title="媒体文件" text="定期复制 Storage 的 media 存储桶，JSON 备份只保存图片地址。"/><BackupItem title="完整数据库" text="同时在 Supabase 开启自动备份，并定期进行恢复演练。"/></div><div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-500/10 p-3 text-xs leading-5 text-blue-700 dark:text-blue-300"><HardDrive size={16} className="mt-0.5 shrink-0"/>备份文件可能包含未发布内容，请妥善保管，不要提交到 GitHub。</div></section>
  </div>
}

function BackupItem({title,text}:{title:string;text:string}){return <div className="rounded-xl border border-black/5 p-4 dark:border-white/10"><b className="text-sm">{title}</b><p className="mt-2 text-xs leading-5 text-zinc-500">{text}</p></div>}
