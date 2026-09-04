import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAuthFetch } from "@/lib/supabase/fetch";

export async function POST() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return NextResponse.json({ok:true});
  const cookieStore=await cookies();
  const pending:Array<{name:string;value:string;options:Parameters<typeof cookieStore.set>[2]}>=[];
  const supabase=createServerClient(url,key,{global:{fetch:supabaseAuthFetch},cookies:{getAll:()=>cookieStore.getAll(),setAll(values){pending.push(...values)}}});
  try{await supabase.auth.signOut()}catch{/* Local cookies are still cleared below. */}
  const response=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
  pending.forEach(({name,value,options})=>response.cookies.set(name,value,options));
  cookieStore.getAll().filter(({name})=>name.startsWith("sb-")).forEach(({name})=>response.cookies.set(name,"",{path:"/",maxAge:0}));
  return response;
}
