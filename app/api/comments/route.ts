import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getComments, getSiteSettings } from "@/lib/data";
import { createServerClientSafe } from "@/lib/supabase/server";

const schema=z.object({articleId:z.number().int().positive(),author:z.string().trim().min(1).max(32),message:z.string().trim().min(1).max(1000)});
export async function GET(req:NextRequest){const id=Number(req.nextUrl.searchParams.get("articleId"));if(!Number.isFinite(id))return NextResponse.json({error:"invalid articleId"},{status:400});return NextResponse.json(await getComments(id));}
export async function POST(req:NextRequest){const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"评论内容不符合要求"},{status:400});const supabase=await createServerClientSafe();if(!supabase)return NextResponse.json({error:"Supabase 未配置，Mock 模式为只读"},{status:503});const settings=await getSiteSettings();const approved=!settings.commentsRequireApproval;const {error}=await supabase.from("comments").insert({article_id:parsed.data.articleId,author:parsed.data.author,message:parsed.data.message,approved});if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({ok:true,pending:!approved},{status:approved?201:202});}
