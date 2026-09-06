import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound(){return <main className="site-width grid min-h-[62vh] place-items-center py-16"><section className="panel max-w-xl px-7 py-10 text-center sm:px-12"><p className="text-7xl font-black tracking-[-.08em] text-pink-500">404</p><h1 className="mt-3 text-2xl font-black">没有找到这个页面</h1><p className="mt-3 text-sm leading-7 text-zinc-500">链接可能已经失效、内容被移动，或者地址输入有误。</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/" className="btn-primary gap-2"><ArrowLeft size={15}/>返回首页</Link><Link href="/search" className="page-btn inline-flex items-center gap-2"><Search size={15}/>搜索内容</Link></div></section></main>}
