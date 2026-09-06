"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, ExternalLink, LogOut, Menu, Plus, UserRound, X } from "lucide-react";
import { useState } from "react";
import { AdminNav } from "@/components/admin-nav";
import { AdminHealthStatus } from "@/components/admin-health-status";

const titles:Record<string,string>={admin:"数据概览",articles:"文章管理",moments:"动态管理",comments:"评论审核",taxonomy:"分类与标签",carousel:"首页轮播",media:"媒体库",settings:"网站设置",system:"系统状态",audit:"操作日志",trash:"文章回收站",history:"版本历史",new:"新建内容"};

export function AdminShell({ children,email,role }:{ children:React.ReactNode;email:string;role:"admin"|"editor" }) {
  const pathname=usePathname();
  const [collapsed,setCollapsed]=useState(()=>typeof window!=="undefined"&&window.localStorage.getItem("admin-sidebar-collapsed")==="true");
  const [mobileOpen,setMobileOpen]=useState(false);
  const parts=pathname.split("/").filter(Boolean).slice(1);
  const current=parts.at(-1)??"admin";
  const pageTitle=/^\d+$/.test(current)?"编辑内容":titles[current]??"管理后台";
  function toggleSidebar(){setCollapsed(value=>{const next=!value;window.localStorage.setItem("admin-sidebar-collapsed",String(next));return next})}
  async function logout(){try{await fetch("/api/auth/logout",{method:"POST",cache:"no-store"})}finally{window.location.replace("/auth/login")}}

  const sidebar=<div className="flex h-full flex-col">
    <div className={`flex h-16 items-center border-b border-black/5 px-4 dark:border-white/10 ${collapsed?"justify-center":"justify-between"}`}><Link href="/admin" className="font-black tracking-tight">{collapsed?<span className="text-xl text-pink-500">N</span>:<>Neko<span className="text-pink-500">Press</span><small className="ml-2 text-[9px] uppercase tracking-widest text-zinc-400">Admin</small></>}</Link>{!collapsed&&<button className="hidden rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 lg:block dark:hover:bg-white/5" onClick={toggleSidebar} aria-label="收起侧栏"><ChevronLeft size={17}/></button>}</div>
    <div className="min-h-0 flex-1 overflow-y-auto"><AdminNav collapsed={collapsed} role={role} onNavigate={()=>setMobileOpen(false)}/></div>
    <div className="border-t border-black/5 p-3 dark:border-white/10"><Link href="/" target="_blank" className={`flex h-10 items-center rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 hover:text-pink-500 dark:hover:bg-white/5 ${collapsed?"justify-center":"gap-3 px-3"}`} title="查看前台"><ExternalLink size={17}/>{!collapsed&&"查看前台"}</Link></div>
  </div>;

  return <div className="admin-system min-h-screen bg-[#f6f7f9] dark:bg-[#0b0d12]"><a href="#admin-main-content" className="skip-link">跳到后台内容</a>
    {mobileOpen&&<button className="fixed inset-0 z-40 bg-black/35 lg:hidden" aria-label="关闭导航" onClick={()=>setMobileOpen(false)}/>}
    <aside className={`fixed inset-y-0 left-0 z-50 border-r border-black/5 bg-white transition-[width,transform] duration-200 dark:border-white/10 dark:bg-[#11141c] ${collapsed?"w-[76px]":"w-[240px]"} ${mobileOpen?"translate-x-0":"-translate-x-full lg:translate-x-0"}`}>{sidebar}<button className="absolute right-3 top-5 lg:hidden" onClick={()=>setMobileOpen(false)} aria-label="关闭导航"><X size={20}/></button></aside>
    <div className={`transition-[margin] duration-200 ${collapsed?"lg:ml-[76px]":"lg:ml-[240px]"}`}>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-black/5 bg-white/90 px-4 backdrop-blur-xl sm:px-6 dark:border-white/10 dark:bg-[#11141c]/90">
        <button className="rounded-xl p-2 hover:bg-zinc-100 lg:hidden dark:hover:bg-white/5" onClick={()=>setMobileOpen(true)} aria-label="打开导航"><Menu size={20}/></button>
        {collapsed&&<button className="hidden rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 lg:block dark:hover:bg-white/5" onClick={toggleSidebar} aria-label="展开侧栏"><ChevronRight size={19}/></button>}
        <div className="min-w-0"><p className="truncate text-[11px] font-bold text-zinc-400">管理后台{parts.length>1?` / ${titles[parts[0]]??"内容"}`:""}</p><h1 className="truncate text-sm font-black">{pageTitle}</h1></div>
        <div className="ml-auto flex items-center gap-2"><AdminHealthStatus compact/><Link href="/admin/articles/new" className="hidden h-9 items-center gap-1.5 rounded-xl bg-pink-500 px-3 text-xs font-black text-white sm:flex"><Plus size={15}/>新建</Link>
          <details className="relative"><summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-xl border border-black/5 bg-white px-2.5 dark:border-white/10 dark:bg-white/5"><span className="grid h-6 w-6 place-items-center rounded-lg bg-pink-500/10 text-pink-500"><UserRound size={14}/></span><span className="hidden max-w-32 truncate text-xs font-bold md:block">{email}</span></summary><div className="absolute right-0 top-11 w-56 rounded-xl border border-black/5 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#181b24]"><p className="truncate px-3 pt-2 text-xs font-bold">{email}</p><p className="px-3 pb-2 pt-1 text-[10px] text-zinc-400">{role==="admin"?"管理员 · 完整权限":"编辑 · 内容权限"}</p><button onClick={()=>void logout()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><LogOut size={14}/>退出登录</button></div></details>
        </div>
      </header>
      <main id="admin-main-content" tabIndex={-1} className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  </div>;
}
