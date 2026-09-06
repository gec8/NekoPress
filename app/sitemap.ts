import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  let articles: Awaited<ReturnType<typeof getArticles>>["items"] = [];
  try { articles = (await getArticles({ page: 1, pageSize: 20 })).items; }
  catch { /* Keep core routes discoverable when content storage is temporarily unavailable. */ }
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/moments`, lastModified: new Date(), changeFrequency: "daily", priority: .65 },
    ...articles.map((article) => ({ url: `${base}/article/${article.slug}`, lastModified: new Date(article.publishedAt), changeFrequency: "weekly" as const, priority: .7 })),
  ];
}
