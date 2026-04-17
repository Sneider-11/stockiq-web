import { Sk } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-xl mx-auto anim-fade-in">
      {/* Avatar + nombre */}
      <div className="flex flex-col items-center mb-8 space-y-3">
        <Sk className="w-20 h-20 rounded-full" />
        <Sk className="h-6 w-40" />
        <Sk className="h-5 w-20 rounded-full" />
      </div>
      {/* Campos del formulario */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 space-y-5">
        <Sk className="h-5 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Sk className="h-3 w-20" />
            <Sk className="h-10 w-full rounded-xl" />
          </div>
        ))}
        <Sk className="h-10 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}
