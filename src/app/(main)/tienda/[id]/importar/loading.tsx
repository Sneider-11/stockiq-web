import { Sk, SkBreadcrumb } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto anim-fade-in">
      <SkBreadcrumb />
      <div className="flex items-center gap-3 mb-6">
        <Sk className="w-9 h-9 rounded-xl shrink-0" />
        <div className="flex items-center gap-3">
          <Sk className="w-9 h-9 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Sk className="h-5 w-32" />
            <Sk className="h-3 w-44" />
          </div>
        </div>
      </div>
      {/* Drop zone */}
      <Sk className="h-48 w-full rounded-2xl mb-5" />
      {/* Info panel */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 space-y-3">
        <Sk className="h-4 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Sk key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}
