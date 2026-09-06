"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="site-width grid min-h-[62vh] place-items-center py-16">
      <section className="panel max-w-xl px-7 py-10 text-center sm:px-12">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
          <AlertTriangle size={23} />
        </span>
        <p className="eyebrow mt-5">Service unavailable</p>
        <h1 className="mt-2 text-2xl font-black tracking-[-.03em]">内容服务暂时不可用</h1>
        <p className="mt-3 text-sm leading-7 text-zinc-500 dark:text-zinc-400">网站内容暂时无法读取，可能是网络波动或数据库连接异常。请稍后重试。</p>
        <button type="button" onClick={reset} className="btn-primary mt-6 gap-2"><RefreshCw size={15} />重新加载</button>
      </section>
    </main>
  );
}
