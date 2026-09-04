import { notFound } from "next/navigation";
import { AdminArticleForm } from "@/components/admin-article-form";
import { getAdminArticle } from "@/lib/admin-data";
export default async function EditArticle({params}:{params:Promise<{id:string}>}){const {id}=await params;const result=await getAdminArticle(Number(id));if(!result.ok)return <div className="panel p-6 text-sm text-red-500">文章读取失败：{result.error}</div>;if(!result.data)notFound();return <AdminArticleForm initial={result.data}/>}
