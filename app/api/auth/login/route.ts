import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { supabaseAuthFetch } from "@/lib/supabase/fetch";

const schema=z.object({email:z.string().email(),password:z.string().min(1)});

export async function POST(request:Request){
  const parsed=schema.safeParse(await request.json());
  if(!parsed.success)return NextResponse.json({error:"请输入正确的邮箱和密码"},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return NextResponse.json({error:"Supabase 尚未配置"},{status:503});
  const cookieStore=await cookies();
  const pending:Array<{name:string;value:string;options:Parameters<typeof cookieStore.set>[2]}>=[];
  const supabase=createServerClient(url,key,{global:{fetch:supabaseAuthFetch},cookies:{getAll:()=>cookieStore.getAll(),setAll(values){pending.push(...values)}}});
  let data;
  let error;
  try {
    ({data,error}=await supabase.auth.signInWithPassword(parsed.data));
  } catch {
    return NextResponse.json({error:"登录服务暂时无法连接，请稍后重试"},{status:502});
  }
  if(error||!data.user)return NextResponse.json({error:error?.message??"登录失败"},{status:401});
  const response=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
  pending.forEach(({name,value,options})=>response.cookies.set(name,value,options));
  return response;
}
