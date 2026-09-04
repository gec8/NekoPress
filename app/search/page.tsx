import { ArticleCard } from "@/components/article-card";
import { Pagination } from "@/components/pagination";
import { getArticles } from "@/lib/data";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams; const q = sp.q?.trim() ?? ""; const page = Math.max(1, Number(sp.page) || 1); const data = q ? await getArticles({ q, page, pageSize: 9 }) : null;
  return <main className="site-width pt-10"><h1 className="text-4xl font-black">搜索</h1><form className="mt-6 flex max-w-2xl gap-3"><input name="q" defaultValue={q} placeholder="搜索文章、标签…" className="field"/><button className="btn-primary">搜索</button></form>{data && <><p className="mt-8 text-sm text-zinc-500">找到 {data.total} 条结果</p><div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{data.items.map((a)=><ArticleCard key={a.id} article={a}/>)}</div><Pagination page={data.page} totalPages={data.totalPages} basePath="/search" params={{ q }}/></>}</main>;
}
