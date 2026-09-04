import Link from "next/link";

export function Footer() {
  return <footer className="mt-20 border-t border-black/5 py-10 text-sm text-zinc-500 dark:border-white/10"><div className="site-width flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><Link href="/" className="brand-mark text-zinc-900 dark:text-white">Neko<span>Press</span></Link><p className="mt-2 text-xs leading-6 text-zinc-400">动漫、游戏、开发与生活灵感的个人内容站。</p></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold"><Link href="/" className="hover:text-pink-500">首页</Link><Link href="/moments" className="hover:text-pink-500">说说</Link><Link href="/search" className="hover:text-pink-500">搜索</Link><Link href="/admin" className="hover:text-pink-500">后台</Link></div><p className="text-xs">© 2026 NekoPress · Next.js</p></div></footer>;
}
