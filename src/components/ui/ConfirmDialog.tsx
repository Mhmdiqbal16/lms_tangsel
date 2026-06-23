import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/utils/helpers';

type ConfirmDialogTone = 'danger' | 'warning' | 'success';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const toneStyles = {
  danger: {
    iconWrapper: 'bg-rose-100 text-rose-700',
    button: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300',
    icon: AlertTriangle,
  },
  warning: {
    iconWrapper: 'bg-amber-100 text-amber-700',
    button: 'bg-amber-600 text-white hover:bg-amber-700 disabled:bg-amber-300',
    icon: AlertTriangle,
  },
  success: {
    iconWrapper: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300',
    icon: CheckCircle2,
  },
} as const;

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  tone = 'warning',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { iconWrapper, button, icon: Icon } = toneStyles[tone];

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', iconWrapper)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-soft transition disabled:cursor-not-allowed',
              button,
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
