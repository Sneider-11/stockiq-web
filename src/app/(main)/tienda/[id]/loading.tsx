import { Sk, SkBreadcrumb } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto anim-fade-in">
      <SkBreadcrumb />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Sk className="w-9 h-9 rounded-xl shrink-0" />
        <div className="flex items-center gap-3 flex-1">
          <Sk className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Sk className="h-6 w-40" />
            <Sk className="h-3 w-28" />
          </div>
        </div>
        <Sk className="h-6 w-20 rounded-full" />
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/60 p-5 mb-5 space-y-3">
        <div className="flex justify-between">
          <Sk className="h-4 w-36" />
          <Sk className="h-8 w-16" />
        </div>
        <Sk className="h-2.5 w-full rounded-full" />
        <div className="flex justify-between">
          <Sk className="h-3 w-32" />
          <Sk className="h-3 w-24" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 space-y-2">
            <Sk className="w-5 h-5 rounded-lg" />
            <Sk className="h-8 w-14" />
            <Sk className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Quick links */}
      <Sk className="h-3 w-16 mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 p-4">
            <Sk className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Sk className="h-4 w-24" />
              <Sk className="h-3 w-36" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
