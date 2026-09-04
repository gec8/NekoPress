"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, Images, LayoutTemplate, MessageSquare, Settings, Sparkles, Tags } from "lucide-react";

const groups = [
  { label:"工作台", items:[{href:"/admin",label:"数据概览",icon:BarChart3,exact:true}] },
  { label:"内容管理", items:[{href:"/admin/articles",label:"文章管理",icon:FileText,exact:false},{href:"/admin/moments",label:"动态管理",icon:Sparkles,exact:false},{href:"/admin/comments",label:"评论审核",icon:MessageSquare,exact:false},{href:"/admin/taxonomy",label:"分类与标签",icon:Tags,exact:false}] },
  { label:"运营管理", items:[{href:"/admin/carousel",label:"首页轮播",icon:LayoutTemplate,exact:false},{href:"/admin/media",label:"媒体库",icon:Images,exact:false}] },
  { label:"系统管理", items:[{href:"/admin/settings",label:"网站设置",icon:Settings,exact:false,adminOnly:true}] },
];

export function AdminNav({ collapsed=false,role, onNavigate }:{ collapsed?:boolean;role:"admin"|"editor"; onNavigate?:()=>void }) {
  const pathname=usePathname();
  return <nav className="mt-3 space-y-5 px-3 pb-5" aria-label="后台导航">
    {groups.map(group=><section key={group.label}>
      {!collapsed&&<p className="mb-1.5 px-2 text-[10px] font-black uppercase tracking-[.14em] text-zinc-400">{group.label}</p>}
      <div className="grid gap-1">{group.items.filter(item=>!("adminOnly" in item&&item.adminOnly&&role!=="admin")).map(item=>{const active=item.exact?pathname===item.href:pathname.startsWith(item.href);const Icon=item.icon;return <Link onClick={onNavigate} title={collapsed?item.label:undefined} key={item.href} href={item.href} className={`flex h-10 items-center rounded-xl text-sm font-bold transition ${collapsed?"justify-center px-0":"gap-3 px-3"} ${active?"bg-pink-500 text-white shadow-sm shadow-pink-500/20":"text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white"}`}><Icon size={17} className="shrink-0"/>{!collapsed&&<span className="truncate">{item.label}</span>}</Link>})}</div>
    </section>)}
  </nav>;
}
