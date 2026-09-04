import { notFound } from "next/navigation";
import { AdminMomentForm } from "@/components/admin-moment-form";
import { getAdminMoment } from "@/lib/admin-data";

export default async function EditMomentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAdminMoment(id);
  if (!result.ok) return <div className="panel p-6 text-sm text-red-500">Moment 读取失败：{result.error}</div>;
  const moment = result.data;
  if (!moment) notFound();
  return <AdminMomentForm initial={moment}/>;
}
