import { Sk, SkBreadcrumb, SkTable } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto anim-fade-in">
      <SkBreadcrumb />
      <div className="flex items-center gap-3 mb-6">
        <Sk className="w-9 h-9 rounded-xl shrink-0" />
        <div className="flex items-center gap-3">
          <Sk className="w-9 h-9 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Sk className="h-5 w-36" />
            <Sk className="h-3 w-32" />
          </div>
        </div>
      </div>
      {/* Badges resumen + botón */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-3">
          <Sk className="h-9 w-28 rounded-xl" />
          <Sk className="h-9 w-32 rounded-xl" />
        </div>
        <Sk className="h-9 w-36 rounded-xl" />
      </div>
      <SkTable rows={8} cols={6} />
    </div>
  );
}
