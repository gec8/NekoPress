"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ArticleVersion } from "@/lib/types";

const labels={update:"编辑前快照",restore:"恢复前快照",trash:"移入回收站前"} as const;
export function AdminVersionList({articleId,items}:{articleId:number;items:ArticleVersion[]}){
  const router=useRouter();const [busy,setBusy]=useState<number|null>(null);const [error,setError]=useState("");
  async function restore(versionId:number){if(!confirm("确定恢复这个版本吗？当前内容会自动保存为新的历史版本。"))return;setBusy(versionId);setError("");try{const response=await fetch("/api/admin/articles/history",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({articleId,versionId})});const result=await response.json();if(!response.ok){setError(result.error??"恢复失败");return}router.push(`/admin/articles/${articleId}`);router.refresh()}catch{setError("无法连接后台服务")}finally{setBusy(null)}}
  return <div className="panel mt-6 overflow-hidden">{items.length===0?<div className="p-10 text-center text-sm text-zinc-500">还没有历史版本。保存文章后会自动记录编辑前的内容。</div>:<div className="divide-y divide-black/5 dark:divide-white/10">{items.map(item=><article key={item.id} className="flex items-center gap-4 p-4"><div className="min-w-0 flex-1"><b className="block truncate">{item.title}</b><p className="mt-1 text-xs text-zinc-400">{labels[item.changeType]} · {new Date(item.createdAt).toLocaleString("zh-CN")}</p></div><button disabled={busy!==null} onClick={()=>void restore(item.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-xs font-bold dark:border-white/10"><RotateCcw size={13}/>{busy===item.id?"恢复中…":"恢复"}</button></article>)}</div>}{error&&<p className="border-t border-red-100 px-4 py-3 text-xs text-red-500">{error}</p>}</div>;
}
