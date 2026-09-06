"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminArticle } from "@/lib/types";

export function AdminTrashList({items}:{items:AdminArticle[]}){
  const router=useRouter();const [busy,setBusy]=useState<number|null>(null);const [error,setError]=useState("");
  async function act(id:number,action:"restore"|"destroy"){if(action==="destroy"&&!confirm("确定永久删除这篇文章吗？此操作无法恢复。"))return;setBusy(id);setError("");try{const response=await fetch("/api/admin/articles",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({id,action})});const result=await response.json();if(!response.ok){setError(result.error??"操作失败");return}router.refresh()}catch{setError("无法连接后台服务")}finally{setBusy(null)}}
  return <div className="panel mt-6 overflow-hidden">{items.length===0?<div className="p-10 text-center text-sm text-zinc-500">回收站为空。</div>:<div className="divide-y divide-black/5 dark:divide-white/10">{items.map(item=><article key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><b className="block truncate">{item.title}</b><p className="mt-1 text-xs text-zinc-400">删除于 {item.deletedAt?new Date(item.deletedAt).toLocaleString("zh-CN"):"未知时间"}</p></div><div className="flex gap-2"><button disabled={busy!==null} onClick={()=>void act(item.id,"restore")} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-xs font-bold dark:border-white/10"><RotateCcw size={13}/>恢复</button><button disabled={busy!==null} onClick={()=>void act(item.id,"destroy")} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-500"><Trash2 size={13}/>永久删除</button></div></article>)}</div>}{error&&<p className="border-t border-red-100 px-4 py-3 text-xs text-red-500">{error}</p>}</div>;
}
