import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface InfoAlertProps {
  tone?: 'info' | 'success' | 'warning';
  message: string;
}

export function InfoAlert({ tone = 'info', message }: InfoAlertProps) {
  const toneStyles = {
    info: {
      wrapper: 'border-brand-200 bg-brand-50 text-brand-700',
      icon: Info,
    },
    success: {
      wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      icon: CheckCircle2,
    },
    warning: {
      wrapper: 'border-amber-200 bg-amber-50 text-amber-700',
      icon: AlertCircle,
    },
  } as const;

  const { wrapper, icon: Icon } = toneStyles[tone];

  return (
    <div className={cn('flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm', wrapper)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="leading-6">{message}</p>
    </div>
  );
}

