import { cn } from '@/utils/helpers';

const badgeVariants = {
  blue: 'bg-brand-100 text-brand-700 ring-brand-200',
  green: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  yellow: 'bg-amber-100 text-amber-700 ring-amber-200',
  red: 'bg-rose-100 text-rose-700 ring-rose-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof badgeVariants;
  className?: string;
}

export function Badge({ children, variant = 'blue', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

