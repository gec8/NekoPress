export default function Loading() {
  return <main className="site-width space-y-8 pb-16 pt-8"><div className="hero-shell animate-pulse bg-black/5 dark:bg-white/5"/><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map((n)=><div key={n} className="h-24 animate-pulse rounded-[18px] bg-black/5 dark:bg-white/5"/>)}</div><div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map((n)=><div key={n} className="h-72 animate-pulse rounded-[22px] bg-black/5 dark:bg-white/5"/>)}</div></main>;
}
