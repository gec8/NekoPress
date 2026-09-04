import { AdminPageSkeleton } from "@/components/admin-skeleton";

export default function Loading() {
  return (
    <>
      <span className="sr-only" role="status">后台内容加载中</span>
      <AdminPageSkeleton />
    </>
  );
}
