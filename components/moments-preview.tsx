import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Moment } from "@/lib/types";
import { SafeImage } from "@/components/safe-image";
import { DEFAULT_MOMENT_IMAGE } from "@/lib/images";

export function MomentsPreview({ items }: { items: Moment[] }) {
  return <section className="panel overflow-hidden p-5 sm:p-7"><div className="section-heading"><div><span>Moments</span><h2>最近动态</h2></div><Link href="/moments" className="flex items-center gap-1 text-xs font-black text-zinc-400 transition hover:text-pink-500">查看全部 <ArrowRight size={14}/></Link></div><div className="grid gap-3 md:grid-cols-3">{items.slice(0,3).map((moment)=><article key={moment.id} className="moment-card overflow-hidden p-0">{moment.imageUrl && <div className="relative aspect-[16/9]"><SafeImage src={moment.imageUrl} fallbackSrc={DEFAULT_MOMENT_IMAGE} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover"/></div>}<div className="p-5"><div className="flex items-center gap-2 text-[11px] font-bold text-pink-500"><Sparkles size={13}/>{moment.mood}</div><p className="mt-3 text-sm font-semibold leading-7 text-zinc-700 dark:text-zinc-200">{moment.content}</p><time className="mt-4 block text-[11px] text-zinc-400">{moment.publishedAt}</time></div></article>)}</div></section>;
}
