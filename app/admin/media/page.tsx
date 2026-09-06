import { AdminMediaManager } from "@/components/admin-media-manager";
import { getAdminMedia } from "@/lib/admin-data";

export default async function MediaPage() {
  const result = await getAdminMedia();
  return (
    <div>
      {!result.ok ? (
        <>
          <h1 className="text-3xl font-black">媒体库</h1>
          <div className="panel mt-6 p-6 text-sm text-red-500">媒体库读取失败：{result.error}</div>
        </>
      ) : (
        <AdminMediaManager initialItems={result.data} />
      )}
    </div>
  );
}
