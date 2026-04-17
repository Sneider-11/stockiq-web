import { Sk, SkBreadcrumb } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto anim-fade-in">
      <SkBreadcrumb />
      <div className="flex items-center gap-3 mb-6">
        <Sk className="w-9 h-9 rounded-xl shrink-0" />
        <div className="flex items-center gap-3 flex-1">
          <Sk className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Sk className="h-5 w-44" />
            <Sk className="h-3 w-28" />
          </div>
        </div>
        <Sk className="h-8 w-24 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Sk className="w-9 h-9 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Sk className="h-4 w-32" />
                <Sk className="h-3 w-48" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-800/60">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="text-center space-y-1">
                  <Sk className="h-5 w-10 mx-auto" />
                  <Sk className="h-3 w-14 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
