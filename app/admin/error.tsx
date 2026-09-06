"use client";

import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function AdminError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  useEffect(()=>{console.error("[admin-render-error]",error)},[error]);
  return <section className="panel mx-auto max-w-xl p-8 text-center" role="alert"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-500"><AlertTriangle size={23}/></span><h2 className="mt-5 text-2xl font-black">后台页面加载失败</h2><p className="mt-3 text-sm leading-7 text-zinc-500">当前操作没有完成。你可以先重新加载；如果持续出现，请前往系统状态检查数据库和网络。</p>{error.digest&&<p className="mt-2 text-xs text-zinc-400">问题编号：{error.digest}</p>}<div className="mt-6 flex flex-wrap justify-center gap-3"><button type="button" onClick={reset} className="btn-primary gap-2"><RefreshCw size={15}/>重新加载</button><Link href="/admin" className="page-btn inline-flex items-center gap-2"><Home size={15}/>返回工作台</Link></div></section>
}
