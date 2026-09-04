function Bar({ className = "" }: { className?: string }) {
  return <div className={`search-skeleton rounded-full ${className}`} />;
}

export function AdminPageSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <header className="space-y-3">
        <Bar className="h-3 w-20" />
        <Bar className="h-9 w-44" />
        <Bar className="h-4 w-72 max-w-full" />
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="panel p-5" key={index}>
            <div className="search-skeleton h-10 w-10 rounded-xl" />
            <Bar className="mt-5 h-3 w-20" />
            <Bar className="mt-3 h-8 w-14" />
            <Bar className="mt-3 h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="panel overflow-hidden">
        <div className="border-b border-black/5 p-5 dark:border-white/10">
          <Bar className="h-5 w-24" />
          <Bar className="mt-2 h-3 w-40" />
        </div>
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="flex items-center gap-4 p-4" key={index}>
              <div className="search-skeleton h-11 w-11 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <Bar className="h-4 w-[min(75%,28rem)]" />
                <Bar className="mt-2 h-3 w-[min(45%,16rem)]" />
              </div>
              <Bar className="h-6 w-14 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminFormSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <Bar className="h-9 w-44" />
      <div className="panel space-y-5 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div><Bar className="mb-2 h-3 w-16" /><div className="search-skeleton h-12 rounded-2xl" /></div>
          <div><Bar className="mb-2 h-3 w-16" /><div className="search-skeleton h-12 rounded-2xl" /></div>
        </div>
        <div><Bar className="mb-2 h-3 w-20" /><div className="search-skeleton h-12 rounded-2xl" /></div>
        <div><Bar className="mb-2 h-3 w-20" /><div className="search-skeleton h-64 rounded-2xl" /></div>
        <div className="flex justify-end"><Bar className="h-10 w-24" /></div>
      </div>
    </div>
  );
}
