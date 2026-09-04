import { Sparkles } from "lucide-react";
import { getMoments } from "@/lib/data";
import { SafeImage } from "@/components/safe-image";
import { DEFAULT_MOMENT_IMAGE } from "@/lib/images";

export const metadata = { title: "说说", description: "NekoPress 的短动态、开发记录和日常碎片。" };

export default async function MomentsPage() {
  const items = await getMoments();
  return <main className="site-width pb-16 pt-10 sm:pt-14"><header className="max-w-2xl"><div className="eyebrow">Moments</div><h1 className="mt-2 text-4xl font-black tracking-[-.04em] sm:text-5xl">说说与最近动态</h1><p className="mt-4 text-sm leading-7 text-zinc-500 dark:text-zinc-400">不需要写成长文章的想法，也值得被认真记录。</p></header><div className="relative mt-10 max-w-3xl before:absolute before:bottom-4 before:left-[17px] before:top-4 before:w-px before:bg-black/[.06] dark:before:bg-white/[.08]">{items.map((moment)=><article key={moment.id} className="relative mb-5 pl-12"><span className="absolute left-2 top-5 grid h-[19px] w-[19px] place-items-center rounded-full bg-pink-500 text-white ring-4 ring-[var(--bg)]"><Sparkles size={10}/></span><div className="panel overflow-hidden">{moment.imageUrl && <div className="relative aspect-[16/9]"><SafeImage src={moment.imageUrl} fallbackSrc={DEFAULT_MOMENT_IMAGE} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover"/></div>}<div className="p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><b className="text-xs text-pink-500">{moment.mood}</b><time className="text-[11px] text-zinc-400">{moment.publishedAt}</time></div><p className="mt-3 text-[15px] font-semibold leading-8 text-zinc-700 dark:text-zinc-200">{moment.content}</p>{moment.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{moment.tags.map((tag)=><span key={tag} className="tag-pill">#{tag}</span>)}</div>}</div></div></article>)}</div></main>;
}
