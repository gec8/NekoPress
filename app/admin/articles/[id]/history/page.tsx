import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminVersionList } from "@/components/admin-version-list";
import { getAdminArticle, getAdminArticleVersions } from "@/lib/admin-data";

export default async function ArticleHistoryPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const articleId=Number(id);const [article,versions]=await Promise.all([getAdminArticle(articleId),getAdminArticleVersions(articleId)]);return <div><Link href={`/admin/articles/${articleId}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500"><ArrowLeft size={14}/>返回编辑</Link><header className="mt-5"><p className="text-xs font-black uppercase tracking-[.2em] text-pink-500">History</p><h1 className="mt-1 text-3xl font-black">文章版本历史</h1><p className="mt-2 text-sm text-zinc-500">{article.ok&&article.data?article.data.title:"查看并恢复文章之前保存的内容"}</p></header>{versions.ok?<AdminVersionList articleId={articleId} items={versions.data}/>:<div className="panel mt-6 p-6 text-sm text-red-500">版本历史读取失败：{versions.error}</div>}</div>}
