import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { revalidateAdminContent, revalidateArticleContent, revalidateMomentContent } from "@/lib/revalidation";

const schema=z.discriminatedUnion("resource",[
  z.object({resource:z.literal("articles"),ids:z.array(z.number().int().positive()).min(1).max(100),action:z.enum(["publish","hide","delete"])}),
  z.object({resource:z.literal("moments"),ids:z.array(z.number().int().positive()).min(1).max(100),action:z.enum(["publish","hide","delete"])}),
  z.object({resource:z.literal("comments"),ids:z.array(z.string().uuid()).min(1).max(100),action:z.enum(["approve","hide","delete"])}),
]);

export async function POST(request:Request){
  const auth=await requireAdmin();
  if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  const parsed=schema.safeParse(await request.json());
  if(!parsed.success)return NextResponse.json({error:"批量操作参数无效"},{status:400});
  const {resource,ids,action}=parsed.data;
  if(action==="delete"&&auth.role!=="admin")return NextResponse.json({error:"只有管理员可以批量删除内容"},{status:403});
  let error:{message:string}|null=null;
  if(resource==="articles"){
    if(action==="delete"){
      const previous=await auth.admin.from("articles").select("slug").in("id",ids);
      const result=await auth.admin.from("articles").delete().in("id",ids);error=result.error;
      previous.data?.forEach(row=>revalidateArticleContent(String(row.slug)));
    }else{
      const result=await auth.admin.from("articles").update({published:action==="publish",...(action==="publish"?{published_at:new Date().toISOString()}: {})}).in("id",ids);error=result.error;
      revalidateArticleContent();
    }
  }
  if(resource==="moments"){
    const result=action==="delete"?await auth.admin.from("moments").delete().in("id",ids):await auth.admin.from("moments").update({published:action==="publish"}).in("id",ids);error=result.error;revalidateMomentContent();
  }
  if(resource==="comments"){
    const result=action==="delete"?await auth.admin.from("comments").delete().in("id",ids):await auth.admin.from("comments").update({approved:action==="approve"}).in("id",ids);error=result.error;
  }
  if(error)return NextResponse.json({error:error.message},{status:500});
  revalidateAdminContent();
  return NextResponse.json({ok:true,count:ids.length});
}
