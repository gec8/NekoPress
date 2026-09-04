import Link from "next/link";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchCommand } from "@/components/search-command";

const nav = [["首页", "/"], ["动漫", "/category/动漫"], ["游戏", "/category/游戏"], ["开发", "/category/开发"], ["说说", "/moments"], ["后台", "/admin"]] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/[.045] bg-[color:var(--surface-header)] dark:border-white/[.07]">
      <div className="site-width flex h-[68px] items-center justify-between gap-4">
        <Link href="/" className="brand-mark">Neko<span>Press</span></Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {nav.map(([label, href]) => <Link key={href} href={href} className="nav-link">{label}</Link>)}
        </nav>
        <div className="flex items-center gap-1.5">
          <SearchCommand />
          <ThemeToggle />
          <Link href="/auth/login" className="btn-primary hidden sm:inline-flex">登录</Link>
          <details className="mobile-menu relative md:hidden">
            <summary className="icon-btn list-none cursor-pointer" aria-label="打开菜单"><Menu size={19}/></summary>
            <div className="absolute right-0 top-12 w-44 rounded-2xl border border-black/5 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#141722]">
              {nav.map(([label, href]) => <Link key={href} href={href} className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-zinc-50 hover:text-pink-500 dark:hover:bg-white/5">{label}</Link>)}
              <Link href="/auth/login" className="mt-1 block rounded-xl bg-pink-500 px-4 py-3 text-center text-sm font-black text-white sm:hidden">登录</Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
