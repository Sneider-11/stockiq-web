function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`shimmer rounded-xl ${className ?? ''}`} />;
}

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 anim-fade-in">
      {/* Page header skeleton */}
      <div className="flex items-start justify-between mb-2">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-7 w-36" />
          <SkeletonBlock className="h-3 w-48 mt-1" />
        </div>
        <SkeletonBlock className="h-9 w-32 rounded-xl" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 space-y-3"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <SkeletonBlock className="h-5 w-5 rounded-lg" />
            <SkeletonBlock className="h-7 w-16" />
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-2.5 w-20" />
          </div>
        ))}
      </div>

      {/* Cards grid */}
      <div>
        <SkeletonBlock className="h-3 w-16 mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden"
              style={{ animationDelay: `${i * 60 + 100}ms` }}
            >
              {/* Accent bar */}
              <SkeletonBlock className="h-0.5 w-full rounded-none" />
              <div className="p-5 space-y-4">
                {/* Card header */}
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonBlock className="h-4 w-32" />
                    <SkeletonBlock className="h-3 w-20" />
                  </div>
                  <SkeletonBlock className="h-5 w-14 rounded-full" />
                </div>
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <SkeletonBlock className="h-3 w-28" />
                    <SkeletonBlock className="h-3 w-8" />
                  </div>
                  <SkeletonBlock className="h-1.5 w-full rounded-full" />
                </div>
                {/* Mini stats */}
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="rounded-lg bg-zinc-800/30 p-2.5 space-y-1.5">
                      <SkeletonBlock className="h-3 w-16" />
                      <SkeletonBlock className="h-5 w-8" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
