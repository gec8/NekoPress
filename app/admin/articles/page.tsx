import Link from "next/link";
import Form from "next/form";
import { Plus, Search } from "lucide-react";
import { getAdminArticlesPage } from "@/lib/admin-data";
import { AdminPagination } from "@/components/admin-pagination";
import { AdminArticleTable } from "@/components/admin-article-table";

export default async function AdminArticles({ searchParams }: { searchParams:Promise<{q?:string;status?:string;page?:string}> }) {
  const { q="", status="all", page="1" } = await searchParams;
  const result = await getAdminArticlesPage({ q, status, page:Number(page) });
  if (!result.ok) return <div className="panel p-6 text-sm text-red-500">文章读取失败：{result.error}</div>;
  const { items, total, totalPages } = result.data;
  return <div>
    <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-pink-500">Content</p><h1 className="mt-1 text-3xl font-black">文章管理</h1><p className="mt-2 text-sm text-zinc-500">共 {total} 篇，当前显示 {items.length} 篇</p></div><Link className="btn-primary shrink-0 whitespace-nowrap" href="/admin/articles/new"><Plus size={15}/>新建文章</Link></div>
    <Form action="/admin/articles" className="panel mt-6 grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_144px_auto]"><label className="relative min-w-0"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16}/><input name="q" defaultValue={q} className="field !pl-11" placeholder="搜索标题、分类或链接…"/></label><select name="status" defaultValue={status} className="field !w-full"><option value="all">全部状态</option><option value="published">已发布</option><option value="draft">草稿</option><option value="featured">精选</option></select><button className="btn-primary min-w-20 shrink-0 justify-center whitespace-nowrap">筛选</button></Form>
    <AdminArticleTable items={items}/>
    <AdminPagination page={result.data.page} totalPages={totalPages} pathname="/admin/articles" params={{...(q?{q}:{}),...(status!=="all"?{status}:{})}} />
  </div>;
}
