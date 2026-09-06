import { AdminTrashList } from "@/components/admin-trash-list";
import { getAdminTrashArticles } from "@/lib/admin-data";

export default async function TrashPage(){const result=await getAdminTrashArticles();return <div><header><p className="text-xs font-black uppercase tracking-[.2em] text-pink-500">Recovery</p><h1 className="mt-1 text-3xl font-black">文章回收站</h1><p className="mt-2 text-sm text-zinc-500">删除的文章会保留在这里，恢复前不会出现在前台。</p></header>{result.ok?<AdminTrashList items={result.data}/>:<div className="panel mt-6 p-6 text-sm text-red-500">回收站读取失败：{result.error}</div>}</div>}
