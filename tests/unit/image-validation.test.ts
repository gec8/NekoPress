import assert from "node:assert/strict";
import test from "node:test";
import { inspectImage } from "../../lib/image-validation.ts";

function png(width:number,height:number){const bytes=new Uint8Array(24);bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);const view=new DataView(bytes.buffer);view.setUint32(16,width);view.setUint32(20,height);return bytes}

test("accepts a PNG by its signature and dimensions",()=>{
  const result=inspectImage(png(1200,800),"image/png");
  assert.equal(result.ok,true);
  if(result.ok){assert.equal(result.info.extension,"png");assert.equal(result.info.width,1200);assert.equal(result.info.height,800)}
});

test("rejects forged MIME types and excessive dimensions",()=>{
  assert.deepEqual(inspectImage(png(1200,800),"image/jpeg"),{ok:false,error:"图片内容与文件类型不一致"});
  assert.equal(inspectImage(png(7000,100),"image/png").ok,false);
});

test("rejects data without a supported image signature",()=>{
  assert.equal(inspectImage(new TextEncoder().encode("not an image"),"image/png").ok,false);
});
