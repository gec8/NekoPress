import Link from "next/link";

export function Pagination({ page, totalPages, basePath, params = {} }: { page: number; totalPages: number; basePath: string; params?: Record<string, string> }) {
  const href = (p: number) => `${basePath}?${new URLSearchParams({ ...params, page: String(p) }).toString()}`;
  return <div className="mt-10 flex items-center justify-center gap-2"><Link aria-disabled={page <= 1} className={`page-btn ${page <= 1 ? "pointer-events-none opacity-40" : ""}`} href={href(Math.max(1, page - 1))}>上一页</Link><span className="px-4 text-sm text-zinc-500">{page} / {totalPages}</span><Link aria-disabled={page >= totalPages} className={`page-btn ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`} href={href(Math.min(totalPages, page + 1))}>下一页</Link></div>;
}
