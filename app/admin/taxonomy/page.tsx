import { TaxonomyManager } from "@/components/taxonomy-manager";
import { getAdminArticles, getAdminCategories } from "@/lib/admin-data";

export default async function TaxonomyPage(){
  const [categories,articles]=await Promise.all([getAdminCategories(),getAdminArticles()]);
  if(!categories.ok)return <div className="panel p-6 text-sm text-red-500">{categories.error}</div>;
  const counts=new Map<string,number>();
  if(articles.ok)for(const article of articles.data)for(const tag of article.tags)counts.set(tag,(counts.get(tag)??0)+1);
  const tags=[...counts].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  return <div><p className="text-xs font-black uppercase tracking-[.2em] text-pink-500">Taxonomy</p><h1 className="mt-1 text-3xl font-black">分类与标签</h1><p className="mb-6 mt-2 text-sm text-zinc-500">调整分类顺序、展示状态和说明，并查看文章标签使用情况。</p><TaxonomyManager initial={categories.data} tags={tags}/></div>;
}
