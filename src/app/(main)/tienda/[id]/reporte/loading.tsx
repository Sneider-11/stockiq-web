import { Sk } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto anim-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Sk className="w-9 h-9 rounded-xl shrink-0" />
        <div className="flex items-center gap-3">
          <Sk className="w-9 h-9 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Sk className="h-5 w-40" />
            <Sk className="h-3 w-32" />
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Sk key={i} className="h-9 w-28 rounded-xl" />
        ))}
      </div>
      {/* Nivel de riesgo */}
      <Sk className="h-16 w-full rounded-2xl mb-5" />
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 space-y-2">
            <Sk className="h-3 w-16" />
            <Sk className="h-8 w-16" />
            <Sk className="h-3 w-24" />
          </div>
        ))}
      </div>
      {/* Body */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Sk key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
