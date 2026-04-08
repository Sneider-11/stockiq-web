import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

const variants: Record<Variant, string> = {
  default: 'bg-zinc-800 text-zinc-300',
  success: 'bg-emerald-950 text-emerald-400 border border-emerald-900',
  warning: 'bg-amber-950 text-amber-400 border border-amber-900',
  danger:  'bg-red-950 text-red-400 border border-red-900',
  info:    'bg-blue-950 text-blue-400 border border-blue-900',
  purple:  'bg-purple-950 text-purple-300 border border-purple-800',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  );
}
