import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { AdminShell } from "@/components/admin-shell";
import { AdminPermissionProvider } from "@/components/admin-permissions";

export default async function AdminLayout({children}:{children:React.ReactNode}){
  const auth=await requireAdmin();
  if("error" in auth && auth.status === 401) redirect("/auth/login?next=/admin");
  if("error" in auth) return <main className="site-width pt-10"><div className="panel mx-auto max-w-xl p-7"><p className="text-xs font-black uppercase tracking-[.2em] text-red-500">后台不可用</p><h1 className="mt-2 text-3xl font-black">无法进入管理后台</h1><p className="mt-4 text-sm leading-7 text-zinc-500">{auth.error}</p><p className="mt-3 text-sm leading-7 text-zinc-500">请检查 Supabase 配置、Service Role Key，以及当前账号在 profiles 表中的角色。</p></div></main>;
  return <AdminPermissionProvider role={auth.role}><AdminShell email={auth.email} role={auth.role}>{children}</AdminShell></AdminPermissionProvider>}
