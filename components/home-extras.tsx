import Link from "next/link";
import type { Article } from "@/lib/types";
import { SafeImage } from "@/components/safe-image";

export function TopicStrip({ title, items }: { title: string; items: Article[] }) {
  return <section><div className="section-heading"><div><span>Topic</span><h2>{title}</h2></div></div><div className="grid gap-4 md:grid-cols-3">{items.slice(0,3).map((a) => <Link key={a.id} href={`/article/${a.slug}`} className="group relative min-h-60 overflow-hidden rounded-[22px] bg-zinc-900"><SafeImage src={a.imageUrl} alt="" fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover image-hover"/><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent"/><div className="absolute bottom-0 p-5 text-white"><span className="text-[11px] font-black uppercase tracking-[.12em] text-pink-300">{a.category}</span><h3 className="mt-1.5 text-lg font-black leading-snug tracking-[-.02em]">{a.title}</h3></div></Link>)}</div></section>;
}

export function LifeSection({ items }: { items: Article[] }) {
  return <section className="grid gap-5 lg:grid-cols-2"><div className="panel p-6 sm:p-7"><p className="eyebrow">Daily quote</p><blockquote className="mt-4 max-w-xl text-2xl font-black leading-relaxed tracking-[-.03em] sm:text-3xl">“把普通的一天记录下来，它就不再普通。”</blockquote><p className="mt-4 text-sm text-zinc-500">— NekoPress</p></div><div className="panel p-6 sm:p-7"><p className="eyebrow">Recent moments</p><div className="mt-4 divide-y divide-black/5 text-sm dark:divide-white/8"><p className="py-3"><b className="mr-4 text-zinc-400">09-01</b>完成 Next.js 主站架构迁移。</p><p className="py-3"><b className="mr-4 text-zinc-400">08-30</b>新增独立游戏专题。</p><p className="py-3"><b className="mr-4 text-zinc-400">08-28</b>调整首页视觉层级与图片性能。</p></div></div>
  <div className="lg:col-span-2"><div className="section-heading"><div><span>Gallery</span><h2>图片墙</h2></div></div><div className="gallery-grid">{items.slice(0,8).map((a, i) => <Link href={`/article/${a.slug}`} key={a.id} className={`group relative overflow-hidden rounded-[18px] ${i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}><SafeImage src={a.imageUrl} alt={a.title} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover image-hover"/><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100"><span className="line-clamp-1 text-xs font-bold text-white">{a.title}</span></div></Link>)}</div></div>
  </section>;
}
