import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clock, Eye } from "lucide-react";
import { CommentSection } from "@/components/comment-section";
import { ArticleCard } from "@/components/article-card";
import { ArticleToc, MobileArticleBar, ReadingProgress, type TocItem } from "@/components/article-reading-tools";
import { getArticleBySlug, getArticleContext, getComments } from "@/lib/data";
import { SafeImage } from "@/components/safe-image";
import { MarkdownContent } from "@/components/markdown-content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return { title: article.title, description: article.excerpt, openGraph: { title: article.title, description: article.excerpt, images: [article.imageUrl], type: "article" } };
}

function shortHeading(text: string, index: number) {
  if (index === 0) return "开篇";
  const first = text.split(/[。！？!?]/)[0].trim().replace(/[：:，,].*$/, "");
  if (first.length >= 4 && first.length <= 22) return first;
  if (first.length > 22) return `${first.slice(0, 18)}…`;
  return `继续阅读 ${String(index + 1).padStart(2, "0")}`;
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  const [comments, context] = await Promise.all([getComments(article.id), getArticleContext(article)]);
  const toc: TocItem[] = article.content.map((text, index) => ({ id: `section-${index + 1}`, title: shortHeading(text, index) }));

  return <main className="site-width pb-24 pt-8 sm:pt-12 lg:pb-16">
    <ReadingProgress />
    <article className="mx-auto max-w-[1080px]">
      <header className="mx-auto max-w-[780px] text-center">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-pink-50 px-3 py-1.5 text-[11px] font-black tracking-[.08em] text-pink-500 dark:bg-pink-500/10">{article.category}<span className="text-pink-200 dark:text-pink-900">/</span>{article.author}</div>
        <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-[-0.045em] sm:text-5xl md:text-[58px]">{article.title}</h1>
        <p className="mx-auto mt-5 max-w-[680px] text-base leading-8 text-zinc-500 dark:text-zinc-400 sm:text-lg">{article.excerpt}</p>
        <div className="mt-5 flex items-center justify-center gap-5 text-xs text-zinc-400"><span className="flex items-center gap-1.5"><Clock size={14}/>{article.readMinutes} 分钟阅读</span><span className="flex items-center gap-1.5"><Eye size={14}/>{article.views} 次浏览</span></div>
      </header>

      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[24px] sm:mt-10 sm:rounded-[28px]"><SafeImage src={article.imageUrl} alt={article.title} fill preload sizes="(max-width: 1080px) 100vw, 1080px" className="object-cover"/></div>

      <div className="relative mx-auto mt-10 grid max-w-[1020px] gap-12 lg:grid-cols-[minmax(0,760px)_190px] lg:items-start sm:mt-12">
        <div>
          <div className="article-body"><section id="section-1" className="article-section scroll-mt-28"><MarkdownContent source={article.content.join("\n\n")}/></section></div>
          <div className="mt-10 flex flex-wrap gap-2 border-t border-black/5 pt-6 dark:border-white/8">{article.tags.map((tag)=><Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="tag-pill">#{tag}</Link>)}</div>
          <nav className="article-neighbors" aria-label="上一篇和下一篇">
            <div>{context.previous ? <Link href={`/article/${context.previous.slug}`}><span><ArrowLeft size={14}/>上一篇</span><b>{context.previous.title}</b></Link> : <div/>}</div>
            <div className="text-right">{context.next ? <Link href={`/article/${context.next.slug}`}><span className="justify-end">下一篇<ArrowRight size={14}/></span><b>{context.next.title}</b></Link> : <div/>}</div>
          </nav>
          <CommentSection articleId={article.id} initial={comments}/>
        </div>
        <aside className="sticky top-24 hidden lg:block"><ArticleToc items={toc}/></aside>
      </div>

      {context.related.length > 0 && <section className="mx-auto mt-16 max-w-[1020px]"><div className="section-heading"><div><span>Keep reading</span><h2>继续阅读</h2></div></div><div className="grid gap-4 md:grid-cols-3">{context.related.map((item)=><ArticleCard key={item.id} article={item} variant="compact"/>)}</div></section>}
    </article>
    <MobileArticleBar items={toc}/>
  </main>;
}
