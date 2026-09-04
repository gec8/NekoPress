import { requireAdmin } from "@/lib/admin";
import type { AdminArticle, AdminComment, AdminMoment, CarouselItem, CategoryItem, SiteSettings } from "@/lib/types";

export type AdminDataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type AdminPage<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const ADMIN_PAGE_SIZE = 10;

function pageRange(value: number) {
  const page = Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
  return { page, from: (page - 1) * ADMIN_PAGE_SIZE, to: page * ADMIN_PAGE_SIZE - 1 };
}

function safeSearch(value: string) {
  return value.trim().replace(/[%_,().]/g, " ").replace(/\s+/g, " ").slice(0, 80);
}

function mapArticle(row: Record<string, unknown>): AdminArticle {
  return { id:Number(row.id), slug:String(row.slug), title:String(row.title), excerpt:String(row.excerpt??""), content:Array.isArray(row.content)?row.content.map(String):[], category:String(row.category??"未分类"), author:String(row.author??"Neko"), publishedAt:String(row.published_at??""), readMinutes:Number(row.read_minutes??1), views:Number(row.views??0), likes:Number(row.likes??0), imageUrl:String(row.image_url??""), featured:Boolean(row.featured), published:Boolean(row.published), tags:Array.isArray(row.tags)?row.tags.map(String):[] };
}

export type AdminDashboardData = {
  articleTotal:number; publishedArticles:number; draftArticles:number; missingCovers:number;
  momentTotal:number; publishedMoments:number; commentTotal:number; pendingCommentTotal:number; totalViews:number;
  recentArticles:{id:number;title:string;category:string;published:boolean;publishedAt:string}[];
  popularArticles:{id:number;title:string;views:number}[];
  pendingComments:{id:string;author:string;message:string;createdAt:string}[];
  publishingTrend:{label:string;value:number}[];
};

export async function getAdminDashboardData():Promise<AdminDataResult<AdminDashboardData>>{
  const auth=await requireAdmin();
  if("error" in auth)return {ok:false,error:auth.error??"后台鉴权失败"};
  const [articlesResult,momentsResult,commentsCountResult,pendingCommentsResult]=await Promise.all([
    auth.admin.from("articles").select("id,title,category,published,published_at,views,image_url").order("published_at",{ascending:false}),
    auth.admin.from("moments").select("id,published"),
    auth.admin.from("comments").select("id",{count:"exact",head:true}),
    auth.admin.from("comments").select("id,author,message,created_at",{count:"exact"}).eq("approved",false).order("created_at",{ascending:false}).limit(4),
  ]);
  const error=articlesResult.error??momentsResult.error??commentsCountResult.error??pendingCommentsResult.error;
  if(error)return {ok:false,error:error.message};
  const articles=articlesResult.data??[];const moments=momentsResult.data??[];const today=new Date();
  const publishingTrend=Array.from({length:7},(_,index)=>{const date=new Date(today);date.setDate(today.getDate()-(6-index));const key=date.toISOString().slice(0,10);return {label:`${date.getMonth()+1}/${date.getDate()}`,value:articles.filter(item=>item.published&&String(item.published_at??"").slice(0,10)===key).length}});
  return {ok:true,data:{articleTotal:articles.length,publishedArticles:articles.filter(x=>x.published).length,draftArticles:articles.filter(x=>!x.published).length,missingCovers:articles.filter(x=>!String(x.image_url??"").trim()).length,momentTotal:moments.length,publishedMoments:moments.filter(x=>x.published).length,commentTotal:commentsCountResult.count??0,pendingCommentTotal:pendingCommentsResult.count??0,totalViews:articles.reduce((sum,x)=>sum+Number(x.views??0),0),recentArticles:articles.slice(0,5).map(x=>({id:Number(x.id),title:String(x.title),category:String(x.category??"未分类"),published:Boolean(x.published),publishedAt:String(x.published_at??"")})),popularArticles:[...articles].sort((a,b)=>Number(b.views??0)-Number(a.views??0)).slice(0,5).map(x=>({id:Number(x.id),title:String(x.title),views:Number(x.views??0)})),pendingComments:(pendingCommentsResult.data??[]).map(x=>({id:String(x.id),author:String(x.author),message:String(x.message),createdAt:String(x.created_at)})),publishingTrend}};
}

export async function getAdminArticles(): Promise<AdminDataResult<AdminArticle[]>> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error ?? "后台鉴权失败" };
  const { data, error } = await auth.admin
    .from("articles")
    .select("id,slug,title,excerpt,category,author,published_at,read_minutes,views,likes,image_url,featured,published,tags")
    .order("published_at", { ascending:false });
  if (error || !data) return { ok: false, error: error?.message ?? "文章读取失败" };
  return { ok: true, data: data.map(mapArticle) };
}

export async function getAdminArticle(id:number): Promise<AdminDataResult<AdminArticle | null>> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error ?? "后台鉴权失败" };
  const { data, error } = await auth.admin.from("articles").select("*").eq("id",id).maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ? mapArticle(data) : null };
}

export async function getAdminArticlesPage(input: { page?: number; q?: string; status?: string } = {}): Promise<AdminDataResult<AdminPage<AdminArticle>>> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error ?? "后台鉴权失败" };
  const { page, from, to } = pageRange(input.page ?? 1);
  const q = safeSearch(input.q ?? "");
  let query = auth.admin
    .from("articles")
    .select("id,slug,title,excerpt,category,author,published_at,read_minutes,views,likes,image_url,featured,published,tags", { count: "exact" });
  if (q) query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%,category.ilike.%${q}%`);
  if (input.status === "published") query = query.eq("published", true);
  if (input.status === "draft") query = query.eq("published", false);
  if (input.status === "featured") query = query.eq("featured", true);
  const { data, error, count } = await query.order("published_at", { ascending: false }).range(from, to);
  if (error || !data) return { ok: false, error: error?.message ?? "文章读取失败" };
  const total = count ?? 0;
  return { ok: true, data: { items: data.map(mapArticle), page, pageSize: ADMIN_PAGE_SIZE, total, totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) } };
}

export async function getAdminComments(): Promise<AdminDataResult<AdminComment[]>> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error ?? "后台鉴权失败" };
  const { data, error } = await auth.admin
    .from("comments")
    .select("id,article_id,author,message,approved,created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return { ok: false, error: error?.message ?? "评论读取失败" };
  return {
    ok: true,
    data: data.map((row) => ({
      id: String(row.id),
      articleId: Number(row.article_id),
      author: String(row.author),
      message: String(row.message),
      approved: Boolean(row.approved),
      createdAt: String(row.created_at),
    })),
  };
}

export async function getAdminCommentsPage(pageValue = 1): Promise<AdminDataResult<AdminPage<AdminComment>>> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error ?? "后台鉴权失败" };
  const { page, from, to } = pageRange(pageValue);
  const { data, error, count } = await auth.admin.from("comments")
    .select("id,article_id,author,message,approved,created_at", { count: "exact" })
    .order("created_at", { ascending: false }).range(from, to);
  if (error || !data) return { ok: false, error: error?.message ?? "评论读取失败" };
  const items = data.map((row) => ({ id:String(row.id), articleId:Number(row.article_id), author:String(row.author), message:String(row.message), approved:Boolean(row.approved), createdAt:String(row.created_at) }));
  const total = count ?? 0;
  return { ok: true, data: { items, page, pageSize: ADMIN_PAGE_SIZE, total, totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) } };
}

export async function getAdminMoments(): Promise<AdminDataResult<AdminMoment[]>> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error ?? "后台鉴权失败" };
  let { data, error } = await auth.admin
    .from("moments")
    .select("id,content,mood,published_at,tags,published,image_url")
    .order("published_at", { ascending: false });
  if (error?.message.includes("image_url")) {
    const fallback = await auth.admin.from("moments").select("id,content,mood,published_at,tags,published").order("published_at", { ascending: false });
    data = fallback.data?.map((row) => ({ ...row, image_url: "" })) ?? null;
    error = fallback.error;
  }
  if (error || !data) return { ok: false, error: error?.message ?? "动态读取失败" };
  return {
    ok: true,
    data: data.map((row) => ({
      id: String(row.id),
      content: String(row.content),
      mood: String(row.mood ?? "动态"),
      publishedAt: String(row.published_at ?? ""),
      tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
      imageUrl: String(row.image_url ?? ""),
      published: Boolean(row.published),
    })),
  };
}

export async function getAdminMoment(id: string): Promise<AdminDataResult<AdminMoment | null>> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error ?? "后台鉴权失败" };
  const { data, error } = await auth.admin.from("moments").select("id,content,mood,published_at,tags,published,image_url").eq("id", id).maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ? { id:String(data.id), content:String(data.content), mood:String(data.mood??"动态"), publishedAt:String(data.published_at??""), tags:Array.isArray(data.tags)?data.tags.map(String):[], imageUrl:String(data.image_url??""), published:Boolean(data.published) } : null };
}

export async function getAdminMomentsPage(pageValue = 1): Promise<AdminDataResult<AdminPage<AdminMoment>>> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error ?? "后台鉴权失败" };
  const { page, from, to } = pageRange(pageValue);
  const { data, error, count } = await auth.admin.from("moments")
    .select("id,content,mood,published_at,tags,published,image_url", { count: "exact" })
    .order("published_at", { ascending: false }).range(from, to);
  if (error || !data) return { ok: false, error: error?.message ?? "动态读取失败" };
  const items = data.map((row) => ({ id:String(row.id), content:String(row.content), mood:String(row.mood??"动态"), publishedAt:String(row.published_at??""), tags:Array.isArray(row.tags)?row.tags.map(String):[], imageUrl:String(row.image_url??""), published:Boolean(row.published) }));
  const total = count ?? 0;
  return { ok: true, data: { items, page, pageSize: ADMIN_PAGE_SIZE, total, totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) } };
}

export type AdminMediaItem = { name:string; path:string; url:string; createdAt:string; size:number };
export async function getAdminMedia(): Promise<AdminDataResult<AdminMediaItem[]>> {
  const auth=await requireAdmin();
  if("error" in auth)return {ok:false,error:auth.error??"后台鉴权失败"};
  const bucket=process.env.SUPABASE_STORAGE_BUCKET||"media";
  const {data:folders,error}=await auth.admin.storage.from(bucket).list("uploads",{limit:100,sortBy:{column:"name",order:"desc"}});
  if(error)return {ok:false,error:error.message};
  const files=(await Promise.all((folders??[]).map(async(folder)=>{
    const {data}=await auth.admin.storage.from(bucket).list(`uploads/${folder.name}`,{limit:100,sortBy:{column:"created_at",order:"desc"}});
    return (data??[]).filter(file=>file.metadata).map(file=>{const path=`uploads/${folder.name}/${file.name}`;return {name:file.name,path,url:auth.admin.storage.from(bucket).getPublicUrl(path).data.publicUrl,createdAt:String(file.created_at??""),size:Number(file.metadata?.size??0)}});
  }))).flat().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  return {ok:true,data:files};
}

export async function getAdminCarousel(): Promise<AdminDataResult<CarouselItem[]>> {
  const auth=await requireAdmin();if("error" in auth)return {ok:false,error:auth.error??"后台鉴权失败"};
  const {data,error}=await auth.admin.from("carousel_items").select("id,article_id,sort_order,enabled,custom_title,custom_excerpt,image_url,starts_at,ends_at").order("sort_order");
  if(error||!data)return {ok:false,error:error?.message??"轮播读取失败"};
  return {ok:true,data:data.map(row=>({id:Number(row.id),articleId:Number(row.article_id),sortOrder:Number(row.sort_order),enabled:Boolean(row.enabled),customTitle:String(row.custom_title??""),customExcerpt:String(row.custom_excerpt??""),imageUrl:String(row.image_url??""),startsAt:String(row.starts_at??""),endsAt:String(row.ends_at??"")}))};
}

export async function getAdminSettings(): Promise<AdminDataResult<SiteSettings>> {
  const auth=await requireAdmin();if("error" in auth)return {ok:false,error:auth.error??"后台鉴权失败"};
  if(auth.role!=="admin")return {ok:false,error:"只有管理员可以查看和修改网站设置"};
  const {data,error}=await auth.admin.from("site_settings").select("site_name,site_description,logo_url,default_cover_url,posts_per_page,comments_require_approval,seo_title,seo_description").eq("id",true).maybeSingle();
  if(error)return {ok:false,error:error.message};
  return {ok:true,data:{siteName:String(data?.site_name??"NekoPress"),siteDescription:String(data?.site_description??"动漫、游戏、开发与生活灵感的个人内容站。"),logoUrl:String(data?.logo_url??""),defaultCoverUrl:String(data?.default_cover_url??""),postsPerPage:Number(data?.posts_per_page??6),commentsRequireApproval:Boolean(data?.comments_require_approval??true),seoTitle:String(data?.seo_title??"NekoPress"),seoDescription:String(data?.seo_description??"")}};
}

export async function getAdminCategories(): Promise<AdminDataResult<CategoryItem[]>> {
  const auth=await requireAdmin();if("error" in auth)return {ok:false,error:auth.error??"后台鉴权失败"};
  const {data,error}=await auth.admin.from("categories").select("id,name,slug,description,color,visible,sort_order").order("sort_order");
  if(error||!data)return {ok:false,error:error?.message??"分类读取失败"};
  return {ok:true,data:data.map(row=>({id:Number(row.id),name:String(row.name),slug:String(row.slug),description:String(row.description??""),color:String(row.color??"#ec4899"),visible:Boolean(row.visible),sortOrder:Number(row.sort_order??0)}))};
}
