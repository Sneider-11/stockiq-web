import { Sk, SkBreadcrumb, SkTable } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto anim-fade-in">
      <SkBreadcrumb />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Sk className="w-9 h-9 rounded-xl shrink-0" />
        <div className="flex items-center gap-3">
          <Sk className="w-9 h-9 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Sk className="h-5 w-24" />
            <Sk className="h-3 w-40" />
          </div>
        </div>
      </div>
      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <Sk className="h-10 flex-1 rounded-xl" />
        <Sk className="h-10 w-64 rounded-xl" />
        <Sk className="h-10 w-28 rounded-xl" />
      </div>
      <Sk className="h-3 w-32 mb-3" />
      <SkTable rows={10} cols={7} />
    </div>
  );
}
