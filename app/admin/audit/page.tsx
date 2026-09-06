import { requireAdmin } from "@/lib/admin";

const actionLabels:Record<string,string>={create:"新建",update:"修改",trash:"移入回收站",restore:"恢复",destroy:"永久删除",publish:"发布",hide:"隐藏",delete:"删除",approve:"通过审核",export:"导出"};
const resourceLabels:Record<string,string>={articles:"文章",moments:"动态",comments:"评论",backup:"备份"};

export default async function AdminAuditPage(){
  const auth=await requireAdmin();
  if("error" in auth)return <div className="panel p-6 text-sm text-red-500">审计日志读取失败：{auth.error}</div>;
  if(auth.role!=="admin")return <div className="panel p-6 text-sm text-red-500">只有管理员可以查看操作日志。</div>;
  const {data,error}=await auth.admin.from("admin_audit_logs").select("id,actor_email,action,resource,resource_id,label,metadata,created_at").order("created_at",{ascending:false}).limit(100);
  if(error)return <div className="panel p-6 text-sm text-amber-600">操作日志尚未启用，请先执行最新数据库迁移。</div>;
  return <div className="space-y-6"><header><p className="text-xs font-black uppercase tracking-[.18em] text-pink-500">Audit</p><h2 className="mt-1 text-2xl font-black">操作日志</h2><p className="mt-1 text-sm text-zinc-500">保留最近 100 条关键后台操作，便于追溯误操作。</p></header><section className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-black/5 text-xs text-zinc-400 dark:border-white/10"><tr><th className="px-5 py-3">时间</th><th className="px-5 py-3">操作人</th><th className="px-5 py-3">操作</th><th className="px-5 py-3">对象</th><th className="px-5 py-3">内容</th></tr></thead><tbody className="divide-y divide-black/5 dark:divide-white/10">{(data??[]).map(row=><tr key={row.id}><td className="whitespace-nowrap px-5 py-3 text-xs text-zinc-400">{new Date(row.created_at).toLocaleString("zh-CN")}</td><td className="px-5 py-3 font-bold">{row.actor_email||"未知用户"}</td><td className="px-5 py-3"><span className="rounded-lg bg-pink-500/10 px-2 py-1 text-xs font-black text-pink-600">{actionLabels[row.action]??row.action}</span></td><td className="px-5 py-3 text-zinc-500">{resourceLabels[row.resource]??row.resource} #{row.resource_id}</td><td className="max-w-72 truncate px-5 py-3">{row.label||"—"}</td></tr>)}{!data?.length&&<tr><td colSpan={5} className="p-8 text-center text-zinc-500">暂无操作记录。</td></tr>}</tbody></table></div></section></div>
}
