import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const data = await getArticles({ page: 1, pageSize: 20 });
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/moments`, lastModified: new Date(), changeFrequency: "daily", priority: .65 },
    ...data.items.map((article) => ({ url: `${base}/article/${article.slug}`, lastModified: new Date(article.publishedAt), changeFrequency: "weekly" as const, priority: .7 })),
  ];
}
