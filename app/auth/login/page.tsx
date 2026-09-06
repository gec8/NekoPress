"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

type LoginResponse = { ok?: boolean; error?: string; kind?: string };

async function readResponse(response: Response): Promise<LoginResponse> {
  try { return await response.json() as LoginResponse; }
  catch { return { error: "登录服务返回了无效响应", kind: "network" }; }
}

export default function LoginPage() {
  const searchParams=useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response=await fetch("/api/auth/login",{method:"POST",cache:"no-store",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})});
      const result=await readResponse(response);
      if (!response.ok) {setSubmitting(false);setMessage(result.error??"登录失败，请稍后重试");return;}
      setMessage("登录成功，正在确认会话…");
      const confirmation=await fetch("/api/auth/session",{cache:"no-store"});
      const session=await readResponse(confirmation);
      if(!confirmation.ok||!session.ok){setSubmitting(false);setMessage(session.error??"会话确认失败，请重新登录");return;}
      setMessage("会话已确认，正在进入后台…");
      const requested=searchParams.get("next")??"/admin";
      const destination=(requested==="/admin"||requested.startsWith("/admin/")||requested.startsWith("/admin?"))&&!requested.startsWith("//")?requested:"/admin";
      window.location.replace(destination);
    } catch {
      setSubmitting(false);
      setMessage("无法连接登录服务，请检查网络后重试");
    }
  }

  return <main className="site-width pt-12"><form onSubmit={submit} className="panel mx-auto max-w-md space-y-4 p-7"><div><span className="text-xs font-black uppercase tracking-[.2em] text-pink-500">Account</span><h1 className="mt-2 text-3xl font-black">登录</h1></div><label className="block"><span className="mb-1.5 block text-xs font-bold text-zinc-500">邮箱</span><input className="field" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} required/></label><label className="block"><span className="mb-1.5 block text-xs font-bold text-zinc-500">密码</span><input className="field" type="password" autoComplete="current-password" placeholder="请输入密码" value={password} onChange={(e)=>setPassword(e.target.value)} required/></label><button type="submit" className="btn-primary w-full" disabled={submitting}>{submitting?"登录中…":"登录"}</button>{message&&<p role="alert" aria-live="polite" className="text-sm text-zinc-500">{message}</p>}</form></main>;
}
