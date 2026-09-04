"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

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
      const result=await response.json();
      if (!response.ok) {setSubmitting(false);setMessage(result.error??"登录失败，请稍后重试");return;}
      setMessage("登录成功，正在跳转…");
      const requested=searchParams.get("next")??"/admin";
      const destination=requested.startsWith("/")&&!requested.startsWith("//")?requested:"/admin";
      window.location.replace(destination);
    } catch {
      setSubmitting(false);
      setMessage("无法连接登录服务，请检查网络后重试");
    }
  }

  return <main className="site-width pt-12"><form onSubmit={submit} className="panel mx-auto max-w-md space-y-4 p-7"><div><span className="text-xs font-black uppercase tracking-[.2em] text-pink-500">Account</span><h1 className="mt-2 text-3xl font-black">登录</h1></div><input className="field" type="email" autoComplete="email" placeholder="邮箱" value={email} onChange={(e)=>setEmail(e.target.value)} required/><input className="field" type="password" autoComplete="current-password" placeholder="密码" value={password} onChange={(e)=>setPassword(e.target.value)} required/><button type="submit" className="btn-primary w-full" disabled={submitting}>{submitting?"登录中…":"登录"}</button>{message&&<p className="text-sm text-zinc-500">{message}</p>}</form></main>;
}
