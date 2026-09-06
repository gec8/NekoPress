"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminRole } from "@/components/admin-permissions";

export function AdminMediaDelete({path}:{path:string}){
  const role=useAdminRole();
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  if(role!=="admin")return null;
  async function remove(){if(!window.confirm("确定删除这张图片吗？此操作不可恢复。"))return;setBusy(true);setMessage("");try{const response=await fetch(`/api/admin/media?path=${encodeURIComponent(path)}`,{method:"DELETE"});const result=await response.json();if(!response.ok){setMessage(result.error??"删除失败");return}router.refresh()}catch{setMessage("无法连接删除服务")}finally{setBusy(false)}}
  return <div className="mt-3"><button type="button" disabled={busy} onClick={()=>void remove()} className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 disabled:opacity-50"><Trash2 size={13}/>{busy?"删除中…":"删除图片"}</button>{message&&<p className="mt-2 text-xs leading-5 text-red-500">{message}</p>}</div>;
}
