import { inspectImage, MAX_IMAGE_BYTES } from "./image-validation.ts";
export const MAX_MEDIA_BYTES=50*1024*1024;
type Info={kind:"image"|"audio"|"video";mime:string;extension:string;width?:number;height?:number};
type Result={ok:true;info:Info}|{ok:false;error:string};
function ascii(bytes:Uint8Array,start:number,length:number){return String.fromCharCode(...bytes.slice(start,start+length))}
export function inspectMedia(bytes:Uint8Array,mime:string):Result{
  if(mime.startsWith("image/")){if(bytes.length>MAX_IMAGE_BYTES)return {ok:false,error:"图片不能超过 8MB"};const value=inspectImage(bytes,mime);return value.ok?{ok:true,info:{kind:"image",...value.info}}:value}
  const formats:Record<string,{kind:"audio"|"video";extension:string;valid:boolean}>={"audio/mpeg":{kind:"audio",extension:"mp3",valid:ascii(bytes,0,3)==="ID3"||(bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0)},"audio/wav":{kind:"audio",extension:"wav",valid:ascii(bytes,0,4)==="RIFF"&&ascii(bytes,8,4)==="WAVE"},"audio/ogg":{kind:"audio",extension:"ogg",valid:ascii(bytes,0,4)==="OggS"},"video/mp4":{kind:"video",extension:"mp4",valid:ascii(bytes,4,4)==="ftyp"},"video/webm":{kind:"video",extension:"webm",valid:bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3}};
  const value=formats[mime];if(!value?.valid)return {ok:false,error:"文件内容与支持的音视频格式不一致"};return {ok:true,info:{kind:value.kind,mime,extension:value.extension}}
}
