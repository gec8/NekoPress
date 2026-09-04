"use client";

import { ArrowUp, Check, Copy, List, MessageCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type TocItem = { id: string; title: string };

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const root = document.documentElement;
        const max = root.scrollHeight - root.clientHeight;
        setProgress(max <= 0 ? 0 : Math.min(100, Math.max(0, (root.scrollTop / max) * 100)));
      });
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  return <div className="reading-progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress / 100})` }}/></div>;
}

export function ArticleToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  useEffect(() => {
    const nodes = items.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible?.target.id) setActive(visible.target.id);
    }, { rootMargin: "-18% 0px -68% 0px", threshold: [0, 1] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);
  return <nav className="article-toc" aria-label="文章目录"><div className="mb-3 text-[10px] font-black uppercase tracking-[.18em] text-zinc-400">On this page</div>{items.map((item,index)=><a key={item.id} href={`#${item.id}`} className={active === item.id ? "active" : ""}><span>{String(index + 1).padStart(2,"0")}</span>{item.title}</a>)}</nav>;
}

export function MobileArticleBar({ items }: { items: TocItem[] }) {
  const [tocOpen, setTocOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const count = useMemo(() => items.length, [items]);
  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  function jumpToComments() { document.getElementById("comments")?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  return <>
    <div className="mobile-article-bar lg:hidden">
      <button type="button" onClick={() => setTocOpen(true)}><List size={17}/><span>目录</span>{count > 0 && <b>{count}</b>}</button>
      <button type="button" onClick={jumpToComments}><MessageCircle size={17}/><span>评论</span></button>
      <button type="button" onClick={copyLink}>{copied ? <Check size={17}/> : <Copy size={17}/>}<span>{copied ? "已复制" : "分享"}</span></button>
      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp size={17}/><span>顶部</span></button>
    </div>
    {tocOpen && <div className="mobile-toc-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setTocOpen(false); }}><div className="mobile-toc-sheet"><div className="mb-4 flex items-center justify-between"><div><div className="eyebrow">Contents</div><h2 className="mt-1 text-xl font-black">文章目录</h2></div><button type="button" className="icon-btn" onClick={() => setTocOpen(false)}><X size={18}/></button></div><div className="space-y-1">{items.map((item,index)=><a key={item.id} href={`#${item.id}`} onClick={() => setTocOpen(false)} className="flex gap-3 rounded-xl px-3 py-3 text-sm font-bold hover:bg-black/[.035] dark:hover:bg-white/[.045]"><span className="text-xs text-pink-500">{String(index+1).padStart(2,"0")}</span><span>{item.title}</span></a>)}</div></div></div>}
  </>;
}
