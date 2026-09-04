import Link from "next/link";
import { Clock, Eye } from "lucide-react";
import type { Article } from "@/lib/types";
import { SafeImage } from "@/components/safe-image";

type Variant = "standard" | "feature" | "compact";

export function ArticleCard({ article, variant = "standard" }: { article: Article; variant?: Variant }) {
  if (variant === "feature") {
    return (
      <article className="card group overflow-hidden md:row-span-2">
        <Link href={`/article/${article.slug}`} className="block h-full">
          <div className="relative aspect-[16/11] overflow-hidden md:aspect-auto md:h-[320px]">
            <SafeImage src={article.imageUrl} alt={article.title} fill sizes="(max-width: 768px) 100vw, 760px" className="object-cover image-hover" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
          </div>
          <div className="p-5 sm:p-6">
            <Meta article={article} />
            <h2 className="mt-3 text-2xl font-black leading-tight tracking-[-0.025em] transition-colors group-hover:text-pink-500 sm:text-3xl">{article.title}</h2>
            <p className="mt-3 line-clamp-3 text-sm leading-7 text-zinc-500 dark:text-zinc-400">{article.excerpt}</p>
            <Stats article={article} />
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="card group overflow-hidden">
        <Link href={`/article/${article.slug}`} className="grid h-full grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr]">
          <div className="relative min-h-36 overflow-hidden">
            <SafeImage src={article.imageUrl} alt={article.title} fill sizes="180px" className="object-cover image-hover" />
          </div>
          <div className="flex min-w-0 flex-col justify-center p-4 sm:p-5">
            <Meta article={article} />
            <h3 className="mt-2 line-clamp-2 text-lg font-black leading-snug tracking-[-0.02em] transition-colors group-hover:text-pink-500">{article.title}</h3>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{article.excerpt}</p>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="card group overflow-hidden">
      <Link href={`/article/${article.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <SafeImage src={article.imageUrl} alt={article.title} fill sizes="(max-width: 768px) 100vw, 520px" className="object-cover image-hover" />
        </div>
        <div className="p-5">
          <Meta article={article} />
          <h2 className="mt-3 text-xl font-black leading-snug tracking-[-0.02em] transition-colors group-hover:text-pink-500">{article.title}</h2>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{article.excerpt}</p>
          <Stats article={article} />
        </div>
      </Link>
    </article>
  );
}

function Meta({ article }: { article: Article }) {
  return <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.08em] text-pink-500"><span>{article.category}</span><span className="text-zinc-300 dark:text-zinc-700">/</span><span className="normal-case tracking-normal text-zinc-400">{article.author}</span></div>;
}

function Stats({ article }: { article: Article }) {
  return <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400"><span className="flex items-center gap-1.5"><Clock size={13}/>{article.readMinutes} 分钟</span><span className="flex items-center gap-1.5"><Eye size={13}/>{article.views}</span></div>;
}
