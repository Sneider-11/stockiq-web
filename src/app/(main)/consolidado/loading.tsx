import { Sk, SkTable } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto anim-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Sk className="h-7 w-36" />
          <Sk className="h-3 w-52" />
        </div>
        <Sk className="h-9 w-40 rounded-xl" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 space-y-2">
            <Sk className="h-3 w-20" />
            <Sk className="h-8 w-24" />
          </div>
        ))}
      </div>
      <SkTable rows={5} cols={7} />
    </div>
  );
}
