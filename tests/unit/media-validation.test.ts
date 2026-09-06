import assert from "node:assert/strict";
import test from "node:test";
import { inspectMedia } from "../../lib/media-validation.ts";

test("accepts supported audio and video signatures",()=>{
  assert.equal(inspectMedia(new Uint8Array([0x49,0x44,0x33,0x04]),"audio/mpeg").ok,true);
  assert.equal(inspectMedia(new Uint8Array([0,0,0,24,0x66,0x74,0x79,0x70]),"video/mp4").ok,true);
  assert.equal(inspectMedia(new Uint8Array([0x1a,0x45,0xdf,0xa3]),"video/webm").ok,true);
});

test("rejects forged or unsupported media",()=>{
  assert.equal(inspectMedia(new Uint8Array([1,2,3,4]),"video/mp4").ok,false);
  assert.equal(inspectMedia(new Uint8Array([0x49,0x44,0x33]),"audio/flac").ok,false);
});
