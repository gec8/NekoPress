export function AdminPublishingChart({items}:{items:{label:string;value:number}[]}){
  const max=Math.max(1,...items.map(item=>item.value));
  return <div className="mt-6 flex h-52 items-end gap-2 sm:gap-4" aria-label="最近七天发布趋势">{items.map(item=><div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-black text-zinc-400">{item.value||""}</span><div className="group relative flex h-36 w-full items-end overflow-hidden rounded-lg bg-zinc-100 dark:bg-white/5"><div className="w-full rounded-lg bg-gradient-to-t from-pink-500 to-rose-300 transition-all" style={{height:`${Math.max(item.value?12:3,(item.value/max)*100)}%`}}/></div><span className="text-[10px] font-bold text-zinc-400">{item.label}</span></div>)}</div>;
}
