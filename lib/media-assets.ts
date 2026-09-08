import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getMediaKind } from "@/lib/media-types";

export type MediaAssetInput = {
  path: string;
  url: string;
  name: string;
  mime: string;
  size: number;
  userId?: string;
  width?: number;
  height?: number;
  status?: "uploading" | "ready" | "failed" | "trash";
  contentHash?: string;
};

export function isMissingMediaCatalog(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const message = String(error.message ?? "").toLocaleLowerCase();
  const namesCatalogTable=message.includes("media_assets")||message.includes("media_references");
  return error.code === "42P01" || namesCatalogTable && (message.includes("schema cache") || message.includes("does not exist"));
}

export async function upsertMediaAsset(admin: SupabaseClient, input: MediaAssetInput) {
  const { error } = await admin.from("media_assets").upsert(
    {
      path: input.path,
      public_url: input.url,
      original_name: input.name,
      mime_type: input.mime,
      media_type: getMediaKind(input.mime, input.path),
      size_bytes: input.size,
      width: input.width ?? null,
      height: input.height ?? null,
      status: input.status ?? "ready",
      ...(input.contentHash ? { content_hash: input.contentHash } : {}),
      uploaded_by: input.userId ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "path" },
  );
  if (error && !isMissingMediaCatalog(error)) console.error("[media-asset-upsert]", error);
  return { ok: !error, missing: isMissingMediaCatalog(error), error };
}

export async function removeMediaAsset(admin: SupabaseClient, path: string) {
  const { error } = await admin.from("media_assets").delete().eq("path", path);
  if (error && !isMissingMediaCatalog(error)) console.error("[media-asset-delete]", error);
}
