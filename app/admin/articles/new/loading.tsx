import { AdminFormSkeleton } from "@/components/admin-skeleton";

export default function Loading() {
  return <><span className="sr-only" role="status">编辑器加载中</span><AdminFormSkeleton /></>;
}
