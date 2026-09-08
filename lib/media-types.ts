export type MediaKind = "image" | "audio" | "video";

export const MEDIA_FILE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,video/mp4,video/webm";
export const MAX_CLIENT_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_CLIENT_AUDIO_VIDEO_BYTES = 50 * 1024 * 1024;
export const RESUMABLE_MEDIA_THRESHOLD = 6 * 1024 * 1024;

const extensionKinds: Record<string, MediaKind> = {
  avif: "image",
  gif: "image",
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
  mp3: "audio",
  ogg: "audio",
  wav: "audio",
  mp4: "video",
  webm: "video",
};

const extensionMimes: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  mp4: "video/mp4",
  webm: "video/webm",
};

function getExtension(path: string) {
  return path.split(".").pop()?.toLocaleLowerCase() ?? "";
}

export function getMediaKind(mime: string, path: string): MediaKind {
  const normalizedMime = mime.toLocaleLowerCase();
  if (normalizedMime.startsWith("audio/")) return "audio";
  if (normalizedMime.startsWith("video/")) return "video";
  if (normalizedMime.startsWith("image/")) return "image";
  return extensionKinds[getExtension(path)] ?? "image";
}

export function getMediaMime(mime: string, path: string) {
  const normalizedMime = mime.trim().toLocaleLowerCase();
  if (/^(image|audio|video)\//.test(normalizedMime)) return normalizedMime;
  return extensionMimes[getExtension(path)] ?? "application/octet-stream";
}

export function getMediaKindLabel(kind: MediaKind) {
  return kind === "image" ? "图片" : kind === "audio" ? "音频" : "视频";
}

export function normalizeMediaDisplayName(name: string, extension: string) {
  let normalized = name
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "_")
    .trim()
    .slice(0, 180);
  if (!normalized) return `media.${extension}`;
  const suppliedExtension = getExtension(normalized);
  if (extensionKinds[suppliedExtension] !== extensionKinds[extension]) {
    normalized = `${normalized.replace(/\.[^.]*$/, "") || "media"}.${extension}`;
  }
  return normalized;
}

export function validateMediaFileSelection(file: { name: string; size: number; type: string }) {
  const kind = getMediaKind(file.type, file.name);
  const extension = file.name.split(".").pop()?.toLocaleLowerCase() ?? "";
  if (!extensionKinds[extension]) return "仅支持 JPG、PNG、WebP、GIF、AVIF、MP3、WAV、OGG、MP4 和 WebM";
  if (kind === "image" && file.size > MAX_CLIENT_IMAGE_BYTES) return "图片不能超过 8MB";
  if (kind !== "image" && file.size > MAX_CLIENT_AUDIO_VIDEO_BYTES) return "音视频不能超过 50MB";
  if (file.size === 0) return "不能上传空文件";
  return "";
}

export function encodeMediaDisplayName(name: string) {
  const bytes = new TextEncoder().encode(name);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function getStoredMediaDisplayName(path: string) {
  const fileName = path.split("/").pop() ?? path;
  const separator = fileName.indexOf("--");
  if (separator < 0) return "";
  try {
    const encoded = fileName.slice(separator + 2).replace(/\.[^.]+$/, "");
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const binary = atob(base64);
    return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
  } catch {
    return "";
  }
}
