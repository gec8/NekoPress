import { articles, categories, initialComments } from "@/lib/mock-data";
import type { Article, CategoryItem, Comment, PaginatedArticles, SiteSettings } from "@/lib/types";
import { createServerClientSafe } from "@/lib/supabase/server";
import { articleImage } from "@/lib/images";
import { cache } from "react";
import { withTimeout } from "@/lib/async";

function mapArticle(row: Record<string, unknown>): Article {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt ?? ""),
    content: Array.isArray(row.content) ? row.content.map(String) : [String(row.content ?? "")],
    category: String(row.category ?? "未分类"),
    author: String(row.author ?? "Neko"),
    publishedAt: String(row.published_at ?? row.publishedAt ?? ""),
    readMinutes: Number(row.read_minutes ?? row.readMinutes ?? 1),
    views: Number(row.views ?? 0),
    likes: Number(row.likes ?? 0),
    imageUrl: articleImage(String(row.image_url ?? row.imageUrl ?? "")),
    featured: Boolean(row.featured),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
  };
}

export async function getArticles(input: { page?: number; pageSize?: number; category?: string; q?: string } = {}): Promise<PaginatedArticles> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(20, Math.max(1, input.pageSize ?? 6));
  const supabase = await createServerClientSafe();
  if (supabase) {
    let query = supabase.from("articles").select("*", { count: "exact" }).eq("published", true).order("published_at", { ascending: false });
    if (input.category && input.category !== "全部") query = query.eq("category", input.category);
    if (input.q) query = query.or(`title.ilike.%${input.q}%,excerpt.ilike.%${input.q}%`);
    const from = (page - 1) * pageSize;
    const result=await withTimeout(query.range(from, from + pageSize - 1));
    const { data, count, error } = result??{data:null,count:null,error:true};
    if (!error && data) {
      const total = count ?? data.length;
      return { items: data.map(mapArticle), page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
    }
  }

  let list = [...articles];
  if (input.category && input.category !== "全部") list = list.filter((a) => a.category === input.category);
  if (input.q) {
    const q = input.q.toLowerCase();
    list = list.filter((a) => `${a.title} ${a.excerpt} ${a.tags.join(" ")}`.toLowerCase().includes(q));
  }
  const total = list.length;
  const start = (page - 1) * pageSize;
  return { items: list.slice(start, start + pageSize), page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = await createServerClientSafe();
  if (supabase) {
    const result=await withTimeout(supabase.from("articles").select("*").eq("slug", slug).eq("published", true).maybeSingle());
    const { data, error }=result??{data:null,error:true};
    if (!error && data) return mapArticle(data);
  }
  return articles.find((a) => a.slug === slug) ?? null;
}

export async function getFeaturedArticles(): Promise<Article[]> {
  const supabase = await createServerClientSafe();
  if (supabase) {
    const result=await withTimeout(supabase.from("carousel_items").select("sort_order,custom_title,custom_excerpt,image_url,article:articles(*)").eq("enabled", true).order("sort_order").limit(5));
    if(result===null){const demoFeatured=articles.filter(article=>article.featured);return (demoFeatured.length?demoFeatured:articles).slice(0,4)}
    const data=result?.data;
    if (data?.length) {
      const configured = data.flatMap((row) => {
        const raw = Array.isArray(row.article) ? row.article[0] : row.article;
        if (!raw) return [];
        const article = mapArticle(raw as Record<string, unknown>);
        return [{ ...article, title: String(row.custom_title || article.title), excerpt: String(row.custom_excerpt || article.excerpt), imageUrl: articleImage(String(row.image_url || article.imageUrl)) }];
      });
      if (configured.length) return configured;
    }
  }
  const all = await getArticles({ page: 1, pageSize: 12 });
  const featured = all.items.filter((a) => a.featured);
  if (featured.length) return featured.slice(0, 4);
  if (all.items.length) return all.items.slice(0, 4);

  // A fresh CMS database is intentionally empty. Keep the homepage hero useful
  // until the first published articles are created in the admin area.
  const demoFeatured = articles.filter((article) => article.featured);
  return (demoFeatured.length ? demoFeatured : articles).slice(0, 4);
}

export async function getCategories(): Promise<string[]> {
  const supabase = await createServerClientSafe();
  if (supabase) {
    const result=await withTimeout(supabase.from("categories").select("name").eq("visible",true).order("sort_order"));const {data,error}=result??{data:null,error:true};
    if (!error && data?.length) return ["全部", ...data.map((x) => String(x.name))];
  }
  return categories;
}

export async function getVisibleCategoryDetails(): Promise<CategoryItem[]> {
  const supabase=await createServerClientSafe();
  if(supabase){const result=await withTimeout(supabase.from("categories").select("id,name,slug,description,color,visible,sort_order").eq("visible",true).order("sort_order"));const {data,error}=result??{data:null,error:true};if(!error&&data?.length)return data.map(row=>({id:Number(row.id),name:String(row.name),slug:String(row.slug),description:String(row.description??""),color:String(row.color??"#ec4899"),visible:true,sortOrder:Number(row.sort_order??0)}));}
  return categories.filter(name=>name!=="全部").map((name,index)=>({name,slug:encodeURIComponent(name),description:"浏览这个分类的最新内容",color:"#ec4899",visible:true,sortOrder:index}));
}

const defaultSiteSettings:SiteSettings={siteName:"NekoPress",siteDescription:"动漫、游戏、开发与生活灵感的个人内容站。",logoUrl:"",defaultCoverUrl:"",postsPerPage:6,commentsRequireApproval:true,seoTitle:"NekoPress",seoDescription:"动漫、游戏、开发与生活灵感的个人内容站。"};
let siteSettingsSnapshot:SiteSettings|undefined;
let siteSettingsExpiresAt=0;

export const getSiteSettings=cache(async (): Promise<SiteSettings> => {
  if(siteSettingsSnapshot&&Date.now()<siteSettingsExpiresAt)return siteSettingsSnapshot;
  const defaults=defaultSiteSettings;
  const supabase=await createServerClientSafe();
  if(!supabase)return defaults;
  const result=await withTimeout(supabase.from("site_settings").select("site_name,site_description,logo_url,default_cover_url,posts_per_page,comments_require_approval,seo_title,seo_description").eq("id",true).maybeSingle());const {data,error}=result??{data:null,error:true};
  siteSettingsSnapshot=error||!data?defaults:{siteName:String(data.site_name??defaults.siteName),siteDescription:String(data.site_description??defaults.siteDescription),logoUrl:String(data.logo_url??""),defaultCoverUrl:String(data.default_cover_url??""),postsPerPage:Number(data.posts_per_page??6),commentsRequireApproval:Boolean(data.comments_require_approval),seoTitle:String(data.seo_title??defaults.seoTitle),seoDescription:String(data.seo_description??defaults.seoDescription)};
  siteSettingsExpiresAt=Date.now()+5000;
  return siteSettingsSnapshot;
});

export async function getComments(articleId: number): Promise<Comment[]> {
  const supabase = await createServerClientSafe();
  if (supabase) {
    const result=await withTimeout(supabase.from("comments").select("id,article_id,author,message,created_at").eq("article_id", articleId).eq("approved", true).order("created_at", { ascending: false }));const {data,error}=result??{data:null,error:true};
    if (!error && data) return data.map((x) => ({ id: String(x.id), articleId: Number(x.article_id), author: String(x.author), message: String(x.message), createdAt: String(x.created_at) }));
  }
  return initialComments.filter((c) => c.articleId === articleId);
}

export async function getMoments() {
  const { moments } = await import("@/lib/mock-data");
  const supabase = await createServerClientSafe();
  if (supabase) {
    const result=await withTimeout(supabase.from("moments").select("id,content,mood,published_at,tags,image_url").eq("published", true).order("published_at", { ascending: false }).limit(30));const {data,error}=result??{data:null,error:true};
    if (!error && data?.length) return data.map((row) => ({ id: String(row.id), content: String(row.content), mood: String(row.mood ?? "动态"), publishedAt: String(row.published_at ?? ""), tags: Array.isArray(row.tags) ? row.tags.map(String) : [], imageUrl: String(row.image_url ?? "") }));
  }
  return moments;
}

export async function getArticleContext(article: Article) {
  const [all, relatedPage] = await Promise.all([
    getArticles({ page: 1, pageSize: 20 }),
    getArticles({ page: 1, pageSize: 6, category: article.category }),
  ]);
  const list = all.items;
  const index = list.findIndex((item) => item.id === article.id);
  const previous = index >= 0 ? list[index + 1] ?? null : null;
  const next = index > 0 ? list[index - 1] ?? null : null;
  const related = relatedPage.items.filter((item) => item.id !== article.id).slice(0, 3);
  return { previous, next, related };
}
