/* Skeleton loading components */

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-line p-5" style={{ background: "var(--surface)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-7 w-16 rounded" />
          <div className="skeleton h-2.5 w-20 rounded" />
        </div>
        <div className="skeleton size-9 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <div
        className="flex gap-4 border-b border-line px-5 py-3"
        style={{ background: "var(--surface-strong)" }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-3 flex-1 rounded" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-4 px-5 py-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <div
                key={colIdx}
                className="skeleton h-3 rounded"
                style={{ flex: colIdx === 0 ? "1.5" : "1", animationDelay: `${rowIdx * 80}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="overflow-hidden rounded-xl border border-line p-5" style={{ background: "var(--surface)" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="space-y-2">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-2.5 w-16 rounded" />
            <div className="skeleton h-2.5 flex-1 rounded" style={{ maxWidth: `${40 + Math.random() * 50}%`, animationDelay: `${i * 100}ms` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded"
          style={{ width: i === lines - 1 ? "65%" : "100%", animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="glass-panel p-6 flex items-start gap-5">
        <div className="skeleton size-16 rounded-full shrink-0" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="skeleton h-5 w-48 rounded" />
          <div className="skeleton h-3 w-32 rounded" />
          <div className="flex gap-2 mt-2">
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="skeleton h-9 w-28 rounded-lg shrink-0" />
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-line p-4 space-y-2" style={{ background: "var(--surface)" }}>
            <div className="skeleton h-2.5 w-16 rounded" />
            <div className="skeleton h-7 w-12 rounded" />
            <div className="skeleton h-2 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
