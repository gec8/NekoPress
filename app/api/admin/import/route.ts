import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { recordAdminAudit } from "@/lib/admin-audit";

export const dynamic="force-dynamic";
const MAX_BACKUP_BYTES=5*1024*1024;
const keys=["articles","moments","categories","carouselItems","mediaAssets","mediaReferences"] as const;

function validate(value:unknown){
  if(!value||typeof value!=="object")return null;
  const backup=value as Record<string,unknown>;const data=backup.data;
  if(backup.format!=="nekopress-content-backup"||![1,2].includes(Number(backup.version))||!data||typeof data!=="object")return null;
  const record=data as Record<string,unknown>;
  if(keys.some(key=>record[key]!==undefined&&!Array.isArray(record[key])))return null;
  if(keys.some(key=>(record[key] as unknown[]|undefined)?.length&&((record[key] as unknown[]).length>5000)))return null;
  return {version:Number(backup.version),data:record,counts:Object.fromEntries(keys.map(key=>[key,Array.isArray(record[key])?record[key].length:0]))};
}

export async function POST(request:Request){
  const auth=await requireAdmin();
  if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  if(auth.role!=="admin")return NextResponse.json({error:"只有管理员可以恢复备份"},{status:403});
  const length=Number(request.headers.get("content-length")||0);
  if(length>MAX_BACKUP_BYTES)return NextResponse.json({error:"备份文件不能超过 5MB"},{status:413});
  const parsed=validate(await request.json().catch(()=>null));
  if(!parsed)return NextResponse.json({error:"不是有效的 NekoPress 备份文件"},{status:400});
  if(new URL(request.url).searchParams.get("preview")==="1")return NextResponse.json({ok:true,version:parsed.version,counts:parsed.counts,mode:"merge"});
  if(request.headers.get("x-confirm-restore")!=="MERGE")return NextResponse.json({error:"恢复确认信息无效"},{status:400});
  const d=parsed.data;
  const operations:Array<{name:string;run:()=>PromiseLike<{error:unknown}>}>=[
    {name:"分类",run:()=>Array.isArray(d.categories)&&d.categories.length?auth.admin.from("categories").upsert(d.categories as object[]):Promise.resolve({error:null})},
    {name:"文章",run:()=>Array.isArray(d.articles)&&d.articles.length?auth.admin.from("articles").upsert(d.articles as object[]):Promise.resolve({error:null})},
    {name:"动态",run:()=>Array.isArray(d.moments)&&d.moments.length?auth.admin.from("moments").upsert(d.moments as object[]):Promise.resolve({error:null})},
    {name:"网站设置",run:()=>d.siteSettings&&typeof d.siteSettings==="object"?auth.admin.from("site_settings").upsert(d.siteSettings):Promise.resolve({error:null})},
    {name:"轮播",run:()=>Array.isArray(d.carouselItems)&&d.carouselItems.length?auth.admin.from("carousel_items").upsert(d.carouselItems as object[]):Promise.resolve({error:null})},
    {name:"媒体资产",run:()=>Array.isArray(d.mediaAssets)&&d.mediaAssets.length?auth.admin.from("media_assets").upsert(d.mediaAssets as object[]):Promise.resolve({error:null})},
    {name:"媒体引用",run:()=>Array.isArray(d.mediaReferences)&&d.mediaReferences.length?auth.admin.from("media_references").upsert(d.mediaReferences as object[]):Promise.resolve({error:null})},
  ];
  for(const operation of operations){
    if((operation.name.startsWith("媒体"))&&parsed.version<2)continue;
    const result=await operation.run();
    if(result.error){console.error("[backup-restore]",operation.name,result.error);return NextResponse.json({error:`${operation.name}恢复失败；已完成的数据不会自动撤销，请检查操作日志和数据库约束`},{status:409});}
  }
  await recordAdminAudit(auth.admin,{actorId:auth.userId,actorEmail:auth.email,action:"restore",resource:"backup",label:`合并恢复 v${parsed.version} 备份`,metadata:parsed.counts});
  return NextResponse.json({ok:true,counts:parsed.counts});
}
