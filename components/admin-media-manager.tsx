"use client";

import { useState } from "react";
import { AdminMediaLibrary } from "@/components/admin-media-library";
import { AdminMediaUpload, type MediaUploadResult } from "@/components/admin-media-upload";
import type { AdminMediaItem } from "@/lib/admin-data";
import { AdminMediaAudit } from "@/components/admin-media-audit";

export function AdminMediaManager({ initialItems }: { initialItems: AdminMediaItem[] }) {
  const [items, setItems] = useState(initialItems);

  function addUploadedItem(item: MediaUploadResult) {
    setItems((current) => [item, ...current.filter((entry) => entry.path !== item.path)]);
  }

  return (
    <>
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-pink-500">Media</p>
          <h1 className="mt-1 text-3xl font-black">媒体库</h1>
          <p className="mt-2 text-sm text-zinc-500">
            图片最大 8MB；MP3/WAV/OGG 音频和 MP4/WebM 视频最大 50MB。
          </p>
        </div>
        <AdminMediaUpload onUploaded={addUploadedItem} />
      </header>
      <AdminMediaAudit />
      <AdminMediaLibrary items={items} onItemsChange={setItems} />
    </>
  );
}
