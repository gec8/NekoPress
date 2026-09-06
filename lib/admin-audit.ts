import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function recordAdminAudit(admin:SupabaseClient,input:{actorId:string;actorEmail:string;action:string;resource:string;resourceId?:string|number;label?:string;metadata?:Record<string,unknown>}){
  const {error}=await admin.from("admin_audit_logs").insert({actor_id:input.actorId,actor_email:input.actorEmail,action:input.action,resource:input.resource,resource_id:String(input.resourceId??""),label:input.label??"",metadata:input.metadata??{}});
  if(error)console.error("[admin-audit]",error.message);
}
