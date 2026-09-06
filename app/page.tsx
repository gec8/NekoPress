import { ArticleCard } from "@/components/article-card";
import { CategoryGrid } from "@/components/category-grid";
import { HeroCarousel } from "@/components/hero-carousel";
import { LifeSection, TopicStrip } from "@/components/home-extras";
import { Pagination } from "@/components/pagination";
import { Sidebar } from "@/components/sidebar";
import { MomentsPreview } from "@/components/moments-preview";
import { getArticles, getFeaturedArticles, getMoments, getSiteSettings } from "@/lib/data";
import type { Article } from "@/lib/types";

export const revalidate = 120;

function uniqueArticles(...groups: Article[][]): Article[] {
  const seen = new Set<number>();
  return groups.flat().filter((article) => {
    if (seen.has(article.id)) return false;
    seen.add(article.id);
    return true;
  });
}

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const settings=await getSiteSettings();
  const [featured, latest, moments] = await Promise.all([getFeaturedArticles(), getArticles({ page, pageSize: settings.postsPerPage }), getMoments()]);
  const merged = uniqueArticles(latest.items, featured);
  const hot = [...merged].sort((a,b) => b.views - a.views);
  const anime = merged.filter((a) => a.category === "动漫" || a.category === "游戏");
  const picks = featured.slice(0, 3);
  return <main className="site-width space-y-14 pb-8 pt-6 sm:space-y-16 sm:pt-8">
    <HeroCarousel items={featured} />
    {latest.total === 0 && <section className="panel px-6 py-12 text-center"><p className="eyebrow">Ready to publish</p><h1 className="mt-2 text-2xl font-black">还没有已发布的文章</h1><p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">内容服务运行正常，发布第一篇文章后会显示在这里。</p></section>}
    <CategoryGrid />
    {picks.length > 0 && <section><div className="section-heading"><div><span>Editor picks</span><h2>编辑精选</h2></div><p className="hidden max-w-sm text-right text-xs leading-5 text-zinc-400 sm:block">不追求数量，只保留值得停下来读一会儿的内容。</p></div><div className="grid gap-4 md:grid-cols-[1.28fr_.92fr] md:grid-rows-2">{picks[0] && <ArticleCard article={picks[0]} variant="feature"/>}<div className="grid gap-4">{picks.slice(1,3).map((a)=><ArticleCard key={a.id} article={a} variant="compact"/>)}</div></div></section>}
    {latest.total > 0 && <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_290px]"><div><div className="section-heading"><div><span>Latest</span><h2>最新文章</h2></div></div><div className="grid gap-4 md:grid-cols-2">{latest.items.map((a)=><ArticleCard key={a.id} article={a}/>)}</div><Pagination page={latest.page} totalPages={latest.totalPages} basePath="/" /></div><Sidebar hot={hot}/></section>}
    <TopicStrip title="动漫与游戏专题" items={anime.length ? anime : featured} />
    <MomentsPreview items={moments} />
    <LifeSection items={merged} />
    <section className="panel px-5 py-6 sm:px-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-zinc-500">友情链接 · Neko Dev · Yuki Notes · Mia Life · Flutter Garden</p><div className="grid grid-cols-4 gap-5 text-center text-xs sm:min-w-[360px]">{[["12","文章"],["8","分类"],["324","评论"],["42K","浏览"]].map(([v,l])=><div key={l}><b className="block text-xl tracking-[-.03em] sm:text-2xl">{v}</b><span className="mt-1 block text-zinc-400">{l}</span></div>)}</div></div></section>
  </main>;
}
