import { SiteSettingsForm } from "@/components/site-settings-form";
import { getAdminSettings } from "@/lib/admin-data";

export default async function SettingsPage(){const result=await getAdminSettings();return <div><p className="text-xs font-black uppercase tracking-[.2em] text-pink-500">Settings</p><h1 className="mt-1 text-3xl font-black">网站设置</h1><p className="mb-6 mt-2 text-sm text-zinc-500">统一管理前台品牌、分页、SEO 和评论策略。</p>{result.ok?<SiteSettingsForm initial={result.data}/>:<div className="panel p-6 text-sm text-red-500">{result.error}</div>}</div>}
