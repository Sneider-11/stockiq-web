import { Sk, SkCard } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto anim-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Sk className="h-7 w-24" />
          <Sk className="h-3 w-36" />
        </div>
        <Sk className="h-9 w-36 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <SkCard key={i} />)}
      </div>
    </div>
  );
}
