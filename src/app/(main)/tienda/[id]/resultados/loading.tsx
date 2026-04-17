import { Sk, SkBreadcrumb, SkTable } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto anim-fade-in">
      <SkBreadcrumb />
      <div className="flex items-center gap-3 mb-6">
        <Sk className="w-9 h-9 rounded-xl shrink-0" />
        <div className="flex items-center gap-3">
          <Sk className="w-9 h-9 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Sk className="h-5 w-28" />
            <Sk className="h-3 w-40" />
          </div>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 space-y-2">
            <Sk className="h-3 w-16" />
            <Sk className="h-7 w-20" />
          </div>
        ))}
      </div>
      <SkTable rows={10} cols={6} />
    </div>
  );
}
