"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload } from "lucide-react";

export function AdminMediaUpload() {
  const router=useRouter();
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  async function upload(file?:File){if(!file)return;setBusy(true);setMessage("正在上传…");const body=new FormData();body.set("file",file);const response=await fetch("/api/upload",{method:"POST",body});const result=await response.json();setBusy(false);if(!response.ok){setMessage(result.error||"上传失败");return}setMessage("上传成功");router.refresh()}
  return <label className="btn-primary cursor-pointer"><Upload size={15}/>{busy?"上传中…":"上传图片"}<input className="sr-only" type="file" accept="image/*" disabled={busy} onChange={(event)=>upload(event.target.files?.[0])}/><span className="sr-only" aria-live="polite">{message}</span></label>;
}
