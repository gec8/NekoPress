import { ArticleCard } from "@/components/article-card";
import { Pagination } from "@/components/pagination";
import { getArticles } from "@/lib/data";

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params; const sp = await searchParams; const page = Math.max(1, Number(sp.page) || 1); const data = await getArticles({ category: decodeURIComponent(slug), page, pageSize: 8 });
  return <main className="site-width pt-10"><div className="mb-8"><span className="text-xs font-black uppercase tracking-[.2em] text-pink-500">Category</span><h1 className="mt-2 text-4xl font-black">{decodeURIComponent(slug)}</h1></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{data.items.map((a)=><ArticleCard key={a.id} article={a}/>)}</div><Pagination page={data.page} totalPages={data.totalPages} basePath={`/category/${slug}`} /></main>;
}
