import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Article } from "@/lib/types";

export function Sidebar({ hot }: { hot: Article[] }) {
  return <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
    <div className="panel p-5"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">About</p><h3 className="mt-2 text-xl font-black tracking-[-.03em]">NekoPress</h3></div><span className="grid h-10 w-10 place-items-center rounded-2xl bg-pink-50 text-lg dark:bg-pink-500/10">猫</span></div><p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">记录动漫、游戏、开发与生活灵感。保持好奇，也保持一点松弛。</p></div>
    <div className="panel p-5"><div className="flex items-center justify-between"><h3 className="font-black tracking-[-.02em]">本周热榜</h3><span className="text-[11px] font-bold text-zinc-400">TOP 5</span></div><div className="mt-3 divide-y divide-black/5 dark:divide-white/8">{hot.slice(0, 5).map((a, i) => <Link key={a.id} href={`/article/${a.slug}`} className="group flex gap-3 py-3.5 text-sm"><span className="w-7 shrink-0 text-lg font-black text-zinc-300 transition-colors group-hover:text-pink-400 dark:text-zinc-700">{String(i+1).padStart(2,"0")}</span><span className="line-clamp-2 leading-5 transition-colors group-hover:text-pink-500">{a.title}</span></Link>)}</div></div>
    <div className="panel p-5"><p className="eyebrow">Notice</p><h3 className="mt-2 font-black">站点公告</h3><p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">新版已迁移到 Next.js + Supabase 架构，后台、评论与媒体系统持续完善。</p><Link href="/admin" className="mt-4 inline-flex items-center gap-1 text-xs font-black text-pink-500">查看后台 <ArrowUpRight size={13}/></Link></div>
  </aside>;
}
