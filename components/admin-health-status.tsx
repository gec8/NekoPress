"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type HealthState = { kind:"checking"|"healthy"|"slow"|"session"|"database"|"network"|"permission"|"configuration"; message:string; latencyMs?:number };

export function AdminHealthStatus({ compact=false }:{ compact?:boolean }) {
  const [state,setState]=useState<HealthState>({kind:"checking",message:"正在检测后台状态"});
  const [checking,setChecking]=useState(false);
  const check=useCallback(async()=>{
    setChecking(true);
    const startedAt=performance.now();
    const controller=new AbortController();
    const timer=window.setTimeout(()=>controller.abort(),10000);
    try {
      const response=await fetch("/api/admin/health",{cache:"no-store",signal:controller.signal});
      const payload=await response.json();
      const latencyMs=Math.round(performance.now()-startedAt);
      if(response.status===401){setState({kind:"session",message:"登录已过期，请重新登录",latencyMs});return;}
      if(!response.ok){const kind=payload.kind==="database"?"database":payload.kind==="permission"?"permission":"configuration";setState({kind,message:payload.message??"后台服务异常",latencyMs});return;}
      setState(latencyMs>1800?{kind:"slow",message:"服务可用，但当前网络响应较慢",latencyMs}:{kind:"healthy",message:"后台服务正常",latencyMs});
    } catch {
      setState({kind:"network",message:navigator.onLine?"无法连接后台服务，请稍后重试":"设备当前处于离线状态"});
    } finally {
      window.clearTimeout(timer);
      setChecking(false);
    }
  },[]);
  useEffect(()=>{const initial=window.setTimeout(()=>void check(),0);const interval=window.setInterval(()=>void check(),60000);return()=>{window.clearTimeout(initial);window.clearInterval(interval)}},[check]);

  const healthy=state.kind==="healthy";
  const slow=state.kind==="slow";
  const checkingState=state.kind==="checking";
  const Icon=checkingState||slow?Clock3:healthy?CheckCircle2:state.kind==="network"?WifiOff:AlertTriangle;
  const color=healthy?"border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300":slow||checkingState?"border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300":"border-red-200 bg-red-50/80 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300";
  return <div className={`${compact?"flex h-9 items-center gap-1.5 rounded-xl px-2.5":"mb-5 flex flex-wrap items-center gap-2 rounded-2xl px-3.5 py-2.5"} border text-xs ${color}`} role="status" title={`${state.message}${state.latencyMs!==undefined?` · ${state.latencyMs}ms`:""}`}>
    <Icon size={15} className={checking?"animate-pulse":""}/><b className={compact?"hidden lg:inline":""}>{state.message}</b>
    {state.latencyMs!==undefined&&<span className={compact?"hidden opacity-70 xl:inline":"opacity-70"}>{state.latencyMs}ms</span>}
    {!compact&&<span className="flex-1"/>}
    {state.kind==="session"&&!compact&&<Link href="/auth/login?next=/admin" className="font-black underline underline-offset-2">重新登录</Link>}
    {!healthy&&state.kind!=="session"&&!compact&&<button type="button" onClick={()=>void check()} disabled={checking} className="inline-flex items-center gap-1 font-black"><RefreshCw size={13} className={checking?"animate-spin":""}/>重新检测</button>}
  </div>;
}
