import Link from "next/link";
import { Code2, Gamepad2, Heart, Library, Music2, Sparkles } from "lucide-react";
import { getVisibleCategoryDetails } from "@/lib/data";

const entries = [
  ["动漫", Sparkles, "新番与补番清单"], ["游戏", Gamepad2, "独立游戏与夜话"], ["开发", Code2, "Flutter / Web / AI"], ["生活", Heart, "桌搭与日常"], ["效率", Library, "阅读与知识管理"], ["音乐", Music2, "歌单与氛围"],
] as const;

export async function CategoryGrid() {
  const configured=await getVisibleCategoryDetails();
  if (!configured.length) return null;
  return <section><div className="section-heading"><div><span>Explore</span><h2>探索分类</h2></div></div><div className="category-scroll grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{configured.map(item=>{const fallback=entries.find(([name])=>name===item.name);const Icon=fallback?.[1]??Sparkles;return <Link key={item.name} href={`/category/${encodeURIComponent(item.name)}`} className="category-card group"><span className="category-icon" style={{color:item.color}}><Icon size={20}/></span><div><h3 className="font-black tracking-[-.02em] group-hover:text-pink-500">{item.name}</h3><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.description||fallback?.[2]||"浏览这个分类的最新内容"}</p></div></Link>})}</div></section>;
}
