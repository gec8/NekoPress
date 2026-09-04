import Link from "next/link";
import { getAdminMomentsPage } from "@/lib/admin-data";
import { AdminPagination } from "@/components/admin-pagination";
import { AdminMomentTable } from "@/components/admin-moment-table";

export default async function AdminMomentsPage({ searchParams }:{ searchParams:Promise<{page?:string}> }) {
  const { page="1" } = await searchParams;
  const result = await getAdminMomentsPage(Number(page));
  if (!result.ok) return <div className="panel p-6 text-sm text-red-500">Moments 读取失败：{result.error}</div>;
  const { items, total, totalPages } = result.data;
  return <div><div className="flex items-center justify-between gap-3"><div><h1 className="text-3xl font-black">Moments 管理</h1><p className="mt-2 text-sm text-zinc-500">共 {total} 条动态</p></div><Link className="btn-primary" href="/admin/moments/new">新建 Moment</Link></div><AdminMomentTable items={items}/><AdminPagination page={result.data.page} totalPages={totalPages} pathname="/admin/moments" /></div>;
}
