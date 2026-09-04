"use client";

import { Loader2 } from "lucide-react";
import { useAdminRole } from "@/components/admin-permissions";

export function AdminTableTools({count,busy,onAction,actions}:{count:number;busy:boolean;onAction:(action:string)=>void;actions:{value:string;label:string;danger?:boolean}[]}){
  const role=useAdminRole();
  if(count===0)return null;
  return <div className="flex flex-wrap items-center gap-2 border-b border-black/5 bg-pink-50/60 px-4 py-2.5 dark:border-white/10 dark:bg-pink-500/5"><b className="mr-2 text-xs text-pink-600">已选 {count} 项</b>{actions.filter(action=>role==="admin"||!action.danger).map(action=><button key={action.value} disabled={busy} onClick={()=>onAction(action.value)} className={`rounded-lg border px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${action.danger?"border-red-200 text-red-500":"border-black/10 bg-white text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"}`}>{busy?<Loader2 className="animate-spin" size={13}/>:action.label}</button>)}</div>;
}
