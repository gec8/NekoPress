"use client";

import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { Article } from "@/lib/types";
import { SafeImage } from "@/components/safe-image";

export function HeroCarousel({ items }: { items: Article[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (paused || items.length < 2 || reduceMotion) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % items.length), 5500);
    return () => window.clearInterval(id);
  }, [items.length, paused, reduceMotion]);
  if (!items.length) return null;
  const item = items[index % items.length];
  const go = (direction: number) => setIndex((current) => (current + direction + items.length) % items.length);
  return (
    <section aria-label="推荐文章轮播" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className="hero-shell relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .38 }} className="absolute inset-0">
          <SafeImage src={item.imageUrl} alt="" fill preload={index === 0} sizes="(max-width: 900px) 100vw, 1180px" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,14,.88)_0%,rgba(9,9,14,.62)_46%,rgba(9,9,14,.16)_100%)]" />
        </motion.div>
      </AnimatePresence>
      <div className="relative z-10 flex min-h-[420px] max-w-2xl flex-col justify-end p-6 text-white sm:min-h-[470px] sm:p-9 md:min-h-[520px] md:p-12">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold tracking-[.08em] text-white/75"><span className="h-1.5 w-1.5 rounded-full bg-pink-400"/>今日推荐<span>·</span>{item.category}</div>
        <h1 className="max-w-[12ch] text-3xl font-black leading-[1.08] tracking-[-0.04em] sm:text-4xl md:text-5xl">{item.title}</h1>
        <p className="mt-4 max-w-xl line-clamp-2 text-sm leading-7 text-white/70 md:text-[15px]">{item.excerpt}</p>
        <Link href={`/article/${item.slug}`} className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-zinc-950 transition-transform hover:-translate-y-0.5">阅读全文 <ArrowUpRight size={15}/></Link>
      </div>
      {items.length > 1 && <div className="absolute right-5 top-5 z-20 flex gap-2 sm:right-7 sm:top-7">
        <button type="button" aria-label="上一张" onClick={() => go(-1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur transition hover:bg-white hover:text-zinc-950"><ArrowLeft size={17}/></button>
        <button type="button" aria-label="下一张" onClick={() => go(1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur transition hover:bg-white hover:text-zinc-950"><ArrowRight size={17}/></button>
      </div>}
      <div className="absolute bottom-5 right-5 z-20 flex gap-2 sm:bottom-7 sm:right-7">{items.map((x, i) => <button type="button" key={x.id} aria-label={`第 ${i + 1} 张`} aria-current={i === index ? "true" : undefined} onClick={() => setIndex(i)} className={`h-1.5 rounded-full transition-[width,background-color] ${i === index ? "w-7 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`} />)}</div>
    </section>
  );
}
