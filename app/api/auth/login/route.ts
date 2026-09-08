import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { supabaseAuthFetch } from "@/lib/supabase/fetch";
import { checkLoginLimit, clearLoginFailures, recordLoginFailure } from "@/lib/auth-rate-limit";
import { isAuthNetworkError } from "@/lib/auth-errors";

const schema=z.object({email:z.string().email(),password:z.string().min(1)});

export async function POST(request:Request){
  const parsed=schema.safeParse(await request.json());
  if(!parsed.success)return NextResponse.json({error:"请输入正确的邮箱和密码",kind:"validation"},{status:400});
  const forwardedFor=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"local";
  const attemptKey=`${forwardedFor}:${parsed.data.email.toLowerCase()}`;
  const limit=checkLoginLimit(attemptKey);
  if(!limit.allowed)return NextResponse.json({error:"尝试次数过多，请稍后再试",kind:"rate_limit"},{status:429,headers:{"Retry-After":String(limit.retryAfterSeconds)}});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return NextResponse.json({error:"Supabase 尚未配置",kind:"configuration"},{status:503});
  const cookieStore=await cookies();
  const pending:Array<{name:string;value:string;options:Parameters<typeof cookieStore.set>[2]}>=[];
  const supabase=createServerClient(url,key,{global:{fetch:supabaseAuthFetch},cookies:{getAll:()=>cookieStore.getAll(),setAll(values){pending.push(...values)}}});
  let data;
  let error;
  try {
    ({data,error}=await supabase.auth.signInWithPassword(parsed.data));
  } catch {
    return NextResponse.json({error:"登录服务暂时无法连接，请稍后重试",kind:"network"},{status:502});
  }
  if(isAuthNetworkError(error))return NextResponse.json({error:"登录服务暂时无法连接，请稍后重试",kind:"network"},{status:502});
  if(error||!data.user){recordLoginFailure(attemptKey);return NextResponse.json({error:"邮箱或密码不正确",kind:"credentials"},{status:401});}
  let profileResult;
  try { profileResult=await supabase.from("profiles").select("role").eq("id",data.user.id).maybeSingle(); }
  catch { return NextResponse.json({error:"数据库暂时无法连接",kind:"database"},{status:503}); }
  if(profileResult.error)return NextResponse.json({error:"数据库暂时无法连接",kind:"database"},{status:503});
  if(!profileResult.data||!["admin","editor"].includes(String(profileResult.data.role)))return NextResponse.json({error:"当前账号没有后台权限",kind:"permission"},{status:403});
  if(!data.session||pending.length===0)return NextResponse.json({error:"登录凭据未能保存，请重试",kind:"session"},{status:502});
  clearLoginFailures(attemptKey);
  const response=NextResponse.json({ok:true,role:profileResult.data.role},{headers:{"Cache-Control":"no-store"}});
  pending.forEach(({name,value,options})=>response.cookies.set(name,value,options));
  return response;
}
