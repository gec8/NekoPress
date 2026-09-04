import { AdminCommentList } from "@/components/admin-comment-list";
import { AdminPagination } from "@/components/admin-pagination";
import { getAdminCommentsPage } from "@/lib/admin-data";

export default async function AdminCommentsPage({ searchParams }:{ searchParams:Promise<{page?:string}> }) {
  const { page="1" } = await searchParams;
  const result = await getAdminCommentsPage(Number(page));
  if (!result.ok) return <div className="panel p-6 text-sm text-red-500">评论读取失败：{result.error}</div>;
  const pending = result.data.items.filter((item) => !item.approved).length;
  return <div><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-black">评论审核</h1><p className="mt-2 text-sm text-zinc-500">本页 {pending} 条待审核 · 共 {result.data.total} 条评论</p></div></div><AdminCommentList items={result.data.items}/><AdminPagination page={result.data.page} totalPages={result.data.totalPages} pathname="/admin/comments" /></div>;
}
