import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

type Check = { ok:boolean; latencyMs:number; message:string; skipped?:boolean };

async function timedCheck(task:()=>Promise<{ error: { message?:string } | null }>,success:string,failure:string):Promise<Check>{
  const startedAt=Date.now();
  try{
    const {error}=await task();
    return {ok:!error,latencyMs:Date.now()-startedAt,message:error?failure:success};
  }catch{
    return {ok:false,latencyMs:Date.now()-startedAt,message:failure};
  }
}

export async function GET(request:Request) {
  const startedAt = Date.now();
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json(
      { ok:false, kind:auth.kind, message:auth.error, latencyMs:Date.now()-startedAt, checkedAt:new Date().toISOString() },
      { status:auth.status, headers:{ "Cache-Control":"no-store" } },
    );
  }
  const mode=new URL(request.url).searchParams.get("mode");
  if(mode==="quick"){
    const latencyMs=Date.now()-startedAt;
    return NextResponse.json({ok:true,kind:"healthy",message:"后台服务正常",latencyMs,checkedAt:new Date().toISOString(),checks:{authentication:{ok:true,latencyMs,message:"登录与数据库正常"}}},{headers:{"Cache-Control":"no-store"}});
  }
  const bucket=process.env.SUPABASE_STORAGE_BUCKET||"media";
  const includeStorage=mode==="full";
  const [database,migration]=await Promise.all([
    timedCheck(async()=>auth.admin.from("site_settings").select("id").limit(1),"数据库连接正常","数据库读取异常"),
    timedCheck(async()=>auth.admin.from("article_versions").select("id").limit(1),"回收站迁移已启用","尚未执行回收站迁移"),
  ]);
  const storage:Check=includeStorage
    ?await timedCheck(async()=>{const {data,error}=await auth.admin.storage.getBucket(bucket);return {error:error??(!data?{message:`找不到 ${bucket} 存储桶`}:null)}},"媒体存储正常","媒体存储异常")
    :{ok:true,latencyMs:0,message:"等待手动检测",skipped:true};
  const checks:Record<string,Check>={authentication:{ok:true,latencyMs:0,message:"登录与后台权限正常"},database,storage,migration};
  const coreHealthy=database.ok;
  const allHealthy=Object.values(checks).filter(item=>!item.skipped).every(item=>item.ok);
  return NextResponse.json(
    {ok:coreHealthy,kind:coreHealthy?(allHealthy?"healthy":"degraded"):"database",message:coreHealthy?(allHealthy?"后台服务正常":"后台可用，但有项目需要处理"):"数据库读取异常",latencyMs:Date.now()-startedAt,checkedAt:new Date().toISOString(),runtime:{node:process.version,environment:process.env.NODE_ENV??"unknown",storageBucket:bucket},checks},
    {status:coreHealthy?200:503,headers:{"Cache-Control":"no-store"}},
  );
}
