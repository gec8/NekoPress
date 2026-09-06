import assert from "node:assert/strict";
import test from "node:test";
import { inspectMedia } from "../../lib/media-validation.ts";
import { encodeMediaDisplayName, getMediaKind, getMediaMime, getStoredMediaDisplayName, normalizeMediaDisplayName } from "../../lib/media-types.ts";

test("accepts supported audio and video signatures",()=>{
  assert.equal(inspectMedia(new Uint8Array([0x49,0x44,0x33,0x04]),"audio/mpeg").ok,true);
  assert.equal(inspectMedia(new Uint8Array([0,0,0,24,0x66,0x74,0x79,0x70]),"video/mp4").ok,true);
  assert.equal(inspectMedia(new Uint8Array([0x1a,0x45,0xdf,0xa3]),"video/webm").ok,true);
  assert.equal(inspectMedia(new Uint8Array([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x41,0x56,0x45]),"audio/x-wav").ok,true);
  assert.equal(inspectMedia(new Uint8Array([0x49,0x44,0x33,0x04]),"audio/mp3").ok,true);
});

test("rejects forged or unsupported media",()=>{
  assert.equal(inspectMedia(new Uint8Array([1,2,3,4]),"video/mp4").ok,false);
  assert.equal(inspectMedia(new Uint8Array([0x49,0x44,0x33]),"audio/flac").ok,false);
});

test("classifies legacy media by extension when MIME metadata is missing", () => {
  assert.equal(getMediaKind("", "uploads/2026-09-06/example.mp3"), "audio");
  assert.equal(getMediaKind("application/octet-stream", "example.webm"), "video");
  assert.equal(getMediaKind("", "example.webp"), "image");
  assert.equal(getMediaMime("", "example.mp3"), "audio/mpeg");
});

test("keeps the original upload name safe for media-library display", () => {
  assert.equal(normalizeMediaDisplayName("我的音乐.mp3", "mp3"), "我的音乐.mp3");
  assert.equal(normalizeMediaDisplayName("folder/bad\u0000name.mp4", "mp4"), "folder_badname.mp4");
  assert.equal(normalizeMediaDisplayName("   ", "webp"), "media.webp");
  assert.equal(normalizeMediaDisplayName("recording.bin", "mp3"), "recording.mp3");
  const storedPath = `uploads/2026-09-06/id--${encodeMediaDisplayName("我的 音乐.mp3")}.mp3`;
  assert.equal(getStoredMediaDisplayName(storedPath), "我的 音乐.mp3");
});
