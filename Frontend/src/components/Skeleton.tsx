export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`glass-panel p-6 space-y-3 animate-pulse ${className}`}>
      <div className="h-4 w-1/3 rounded bg-white/10" />
      <div className="h-8 w-1/2 rounded bg-white/15" />
      <div className="h-3 w-2/3 rounded bg-white/5" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-panel p-6 space-y-4 animate-pulse">
      <div className="h-5 w-1/4 rounded bg-white/10 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 w-full rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="glass-panel p-6 space-y-4 animate-pulse">
      <div className="h-5 w-1/3 rounded bg-white/10" />
      <div className="h-64 w-full rounded-xl bg-white/5 flex items-end justify-between p-4 gap-2">
        <div className="h-1/3 w-full rounded bg-white/10" />
        <div className="h-2/3 w-full rounded bg-white/15" />
        <div className="h-1/2 w-full rounded bg-white/10" />
        <div className="h-3/4 w-full rounded bg-white/20" />
        <div className="h-2/5 w-full rounded bg-white/10" />
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="glass-panel p-8 space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-full bg-white/15" />
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-white/15" />
          <div className="h-4 w-32 rounded bg-white/10" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
