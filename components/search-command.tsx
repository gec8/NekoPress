"use client";

import Link from "next/link";
import { Search, X, Clock, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Article, PaginatedArticles } from "@/lib/types";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const controller = new AbortController();
    const id = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/articles?q=${encodeURIComponent(q)}&pageSize=6`, { signal: controller.signal });
        if (!response.ok) return;
        const data = (await response.json()) as PaginatedArticles;
        setItems(data.items);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  function submit() {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return <>
    <button className="icon-btn" type="button" aria-label="搜索，快捷键 Ctrl K" onClick={() => setOpen(true)}><Search size={18}/></button>
    {open && <div className="search-overlay" role="dialog" aria-modal="true" aria-label="站内搜索" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="search-command">
        <div className="flex items-center gap-3 border-b border-black/5 px-4 dark:border-white/8">
          <Search size={18} className="shrink-0 text-zinc-400"/>
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="搜索文章、标签、分类…"/>
          <kbd className="hidden rounded-lg border border-black/8 px-2 py-1 text-[10px] font-bold text-zinc-400 sm:block dark:border-white/10">ESC</kbd>
          <button type="button" className="icon-btn !h-9 !w-9" aria-label="关闭搜索" onClick={() => setOpen(false)}><X size={16}/></button>
        </div>
        <div className="max-h-[62vh] overflow-y-auto p-2">
          {!query.trim() && <div className="p-4 text-sm text-zinc-500"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-zinc-400"><Clock size={14}/>快速发现</div><p>输入标题、标签或分类。你也可以随时按 <b>Ctrl K</b> 打开搜索。</p></div>}
          {loading && <div className="space-y-2 p-2">{[1,2,3].map((n)=><div key={n} className="search-skeleton h-16 rounded-xl"/>)}</div>}
          {!loading && query.trim() && items.length === 0 && <div className="p-8 text-center text-sm text-zinc-500">没有找到匹配内容，试试更短的关键词。</div>}
          {!loading && query.trim() && items.map((article) => <Link key={article.id} href={`/article/${article.slug}`} onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-xl p-3 hover:bg-black/[.035] dark:hover:bg-white/[.045]">
            <div className="min-w-0 flex-1"><div className="text-[11px] font-black text-pink-500">{article.category} · {article.readMinutes} 分钟</div><div className="mt-1 truncate text-sm font-extrabold">{article.title}</div><div className="mt-1 truncate text-xs text-zinc-400">{article.excerpt}</div></div><ArrowRight size={16} className="shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-pink-500"/>
          </Link>)}
        </div>
        {query.trim() && <button type="button" onClick={submit} className="flex w-full items-center justify-between border-t border-black/5 px-5 py-3 text-xs font-bold text-zinc-500 hover:text-pink-500 dark:border-white/8"><span>查看全部搜索结果</span><span>Enter ↵</span></button>}
      </div>
    </div>}
  </>;
}
