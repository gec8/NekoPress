import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getStoredMediaDisplayName, getMediaKind, getMediaMime } from "@/lib/media-types";
import { isMissingMediaCatalog } from "@/lib/media-assets";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordAdminAudit } from "@/lib/admin-audit";

export const dynamic="force-dynamic";
type StorageFile={path:string;name:string;size:number;mime:string;createdAt:string};
type AuditResult={ok:false;error:string;status:number}|{ok:true;auth:{admin:SupabaseClient;role:"admin"|"editor";userId:string;email:string};bucket:string;files:StorageFile[];unindexed:StorageFile[];missing:string[];interrupted:string[]};

async function storageFiles(auth:{admin:SupabaseClient},bucket:string){
  const root=await auth.admin.storage.from(bucket).list("uploads",{limit:100,sortBy:{column:"name",order:"desc"}});
  if(root.error)throw root.error;
  return (await Promise.all((root.data??[]).map(async folder=>{
    const result=await auth.admin.storage.from(bucket).list(`uploads/${folder.name}`,{limit:100,sortBy:{column:"created_at",order:"desc"}});
    if(result.error)throw result.error;
    return (result.data??[]).filter(file=>file.metadata).map(file=>{const path=`uploads/${folder.name}/${file.name}`;const stored=file.metadata?.originalName??file.metadata?.metadata?.originalName;const name=typeof stored==="string"&&stored.trim()?stored:getStoredMediaDisplayName(path)||file.name;return {path,name,size:Number(file.metadata?.size??0),mime:getMediaMime(String(file.metadata?.mimetype??""),path),createdAt:String(file.created_at??"")};});
  }))).flat();
}

async function inspect():Promise<AuditResult>{
  const auth=await requireAdmin();
  if(!auth.admin)return {ok:false,error:auth.error??"后台鉴权失败",status:auth.status??503};
  const authorized={admin:auth.admin,role:auth.role as "admin"|"editor",userId:auth.userId??"",email:auth.email??"管理员"};
  const bucket=process.env.SUPABASE_STORAGE_BUCKET||"media";
  try{
    const [files,catalog]=await Promise.all([storageFiles(authorized,bucket),authorized.admin.from("media_assets").select("path,status,updated_at").limit(1000)]);
    if(catalog.error)return {ok:false,error:isMissingMediaCatalog(catalog.error)?"请先执行媒体资产数据库迁移":"媒体索引读取失败",status:503};
    const storagePaths=new Set(files.map(file=>file.path));
    const catalogPaths=new Set((catalog.data??[]).map(row=>String(row.path)));
    const unindexed=files.filter(file=>!catalogPaths.has(file.path));
    const missing=(catalog.data??[]).filter(row=>!storagePaths.has(String(row.path))&&row.status!=="trash").map(row=>String(row.path));
    const cutoff=Date.now()-60*60*1000;
    const interrupted=(catalog.data??[]).filter(row=>row.status==="uploading"&&new Date(String(row.updated_at)).getTime()<cutoff).map(row=>String(row.path));
    return {ok:true,auth:authorized,bucket,files,unindexed,missing,interrupted};
  }catch(error){console.error("[media-audit]",error);return {ok:false,error:"媒体存储检查失败，请稍后重试",status:503};}
}

export async function GET(){
  const result=await inspect();
  if(!result.ok)return NextResponse.json({error:result.error},{status:result.status});
  return NextResponse.json({ok:true,total:result.files.length,unindexed:result.unindexed.length,missing:result.missing.length,interrupted:result.interrupted.length},{headers:{"cache-control":"no-store"}});
}

export async function POST(){
  const result=await inspect();
  if(!result.ok)return NextResponse.json({error:result.error},{status:result.status});
  if(result.auth.role!=="admin")return NextResponse.json({error:"只有管理员可以修复媒体索引"},{status:403});
  const now=new Date().toISOString();
  if(result.unindexed.length){
    const rows=result.unindexed.map(file=>({path:file.path,public_url:result.auth.admin.storage.from(result.bucket).getPublicUrl(file.path).data.publicUrl,original_name:file.name,mime_type:file.mime,media_type:getMediaKind(file.mime,file.path),size_bytes:file.size,status:"ready",created_at:file.createdAt||now,updated_at:now}));
    const {error}=await result.auth.admin.from("media_assets").upsert(rows,{onConflict:"path"});
    if(error)return NextResponse.json({error:"缺失媒体索引修复失败"},{status:500});
  }
  const failedPaths=[...new Set([...result.missing,...result.interrupted.filter(path=>result.missing.includes(path))])];
  if(failedPaths.length){const {error}=await result.auth.admin.from("media_assets").update({status:"failed",updated_at:now}).in("path",failedPaths);if(error)return NextResponse.json({error:"异常状态更新失败"},{status:500});}
  const recovered=result.interrupted.filter(path=>!result.missing.includes(path));
  if(recovered.length){const {error}=await result.auth.admin.from("media_assets").update({status:"ready",updated_at:now}).in("path",recovered);if(error)return NextResponse.json({error:"上传状态修复失败"},{status:500});}
  const repaired=result.unindexed.length+failedPaths.length+recovered.length;
  await recordAdminAudit(result.auth.admin,{actorId:result.auth.userId,actorEmail:result.auth.email,action:"repair",resource:"media",resourceId:"catalog",label:`修复 ${repaired} 项媒体异常`,metadata:{unindexed:result.unindexed.length,missing:failedPaths.length,interrupted:recovered.length}});
  return NextResponse.json({ok:true,repaired});
}
