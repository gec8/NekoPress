import Link from "next/link";

export function AdminPagination({ page, totalPages, pathname, params = {} }: { page:number; totalPages:number; pathname:string; params?:Record<string,string> }) {
  if (totalPages <= 1) return null;
  const href = (target:number) => {
    const query = new URLSearchParams(params);
    query.set("page", String(target));
    return `${pathname}?${query.toString()}`;
  };
  return <nav aria-label="分页" className="mt-5 flex items-center justify-between gap-3">
    {page > 1 ? <Link className="page-btn" href={href(page-1)}>← 上一页</Link> : <span className="page-btn cursor-not-allowed opacity-40">← 上一页</span>}
    <span className="text-xs font-bold text-zinc-500">第 {page} / {totalPages} 页</span>
    {page < totalPages ? <Link className="page-btn" href={href(page+1)}>下一页 →</Link> : <span className="page-btn cursor-not-allowed opacity-40">下一页 →</span>}
  </nav>;
}
