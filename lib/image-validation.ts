export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_EDGE = 6000;
export const MAX_IMAGE_PIXELS = 24_000_000;

type ImageInfo = { mime: string; extension: string; width: number; height: number };
type ImageInspection = { ok: true; info: ImageInfo } | { ok: false; error: string };

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function jpegSize(bytes: Uint8Array) {
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
      return { height: (bytes[offset + 5] << 8) | bytes[offset + 6], width: (bytes[offset + 7] << 8) | bytes[offset + 8] };
    }
    if (length < 2) break;
    offset += 2 + length;
  }
  return null;
}

function webpSize(bytes: Uint8Array) {
  const kind = ascii(bytes, 12, 4);
  if (kind === "VP8X" && bytes.length >= 30) return { width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16) };
  if (kind === "VP8L" && bytes.length >= 25) {
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (kind === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) return { width: (bytes[26] | (bytes[27] << 8)) & 0x3fff, height: (bytes[28] | (bytes[29] << 8)) & 0x3fff };
  return null;
}

function avifSize(bytes: Uint8Array) {
  for (let index = 4; index + 12 <= bytes.length; index += 1) {
    if (ascii(bytes, index, 4) === "ispe") {
      const view = new DataView(bytes.buffer, bytes.byteOffset + index + 8, 8);
      return { width: view.getUint32(0), height: view.getUint32(4) };
    }
  }
  return null;
}

export function inspectImage(bytes: Uint8Array, claimedMime: string): ImageInspection {
  let detected: Omit<ImageInfo, "width" | "height"> | null = null;
  let size: { width: number; height: number } | null = null;
  if (bytes.length >= 24 && bytes.slice(0,8).every((value,index)=>value===[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a][index])) {
    detected={mime:"image/png",extension:"png"}; const view=new DataView(bytes.buffer,bytes.byteOffset+16,8); size={width:view.getUint32(0),height:view.getUint32(4)};
  } else if (bytes.length >= 10 && ["GIF87a","GIF89a"].includes(ascii(bytes,0,6))) {
    detected={mime:"image/gif",extension:"gif"}; size={width:bytes[6]|(bytes[7]<<8),height:bytes[8]|(bytes[9]<<8)};
  } else if (bytes.length >= 12 && bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff) {
    detected={mime:"image/jpeg",extension:"jpg"}; size=jpegSize(bytes);
  } else if (bytes.length >= 30 && ascii(bytes,0,4)==="RIFF" && ascii(bytes,8,4)==="WEBP") {
    detected={mime:"image/webp",extension:"webp"}; size=webpSize(bytes);
  } else if (bytes.length >= 24 && ascii(bytes,4,4)==="ftyp" && ["avif","avis"].includes(ascii(bytes,8,4))) {
    detected={mime:"image/avif",extension:"avif"}; size=avifSize(bytes);
  }
  if (!detected) return { ok:false, error:"文件内容不是支持的图片格式" };
  if (claimedMime !== detected.mime) return { ok:false, error:"图片内容与文件类型不一致" };
  if (!size || size.width < 1 || size.height < 1) return { ok:false, error:"无法读取图片尺寸" };
  if (size.width > MAX_IMAGE_EDGE || size.height > MAX_IMAGE_EDGE || size.width * size.height > MAX_IMAGE_PIXELS) return { ok:false, error:`图片尺寸过大，最长边不能超过 ${MAX_IMAGE_EDGE}px，且总像素不能超过 2400 万` };
  return { ok:true, info:{...detected,...size} };
}
