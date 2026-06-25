import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/utils/helpers';

export type ToastTone = 'info' | 'success' | 'warning';

interface ToastPayload {
  tone?: ToastTone;
  message: string;
  duration?: number;
}

interface ToastItem extends Required<ToastPayload> {
  id: string;
}

interface ToastContextValue {
  showToast: (payload: ToastPayload) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles = {
  info: {
    wrapper: 'border-brand-200 bg-white text-brand-700',
    iconWrapper: 'bg-brand-50 text-brand-600',
    icon: Info,
  },
  success: {
    wrapper: 'border-emerald-200 bg-white text-emerald-700',
    iconWrapper: 'bg-emerald-50 text-emerald-600',
    icon: CheckCircle2,
  },
  warning: {
    wrapper: 'border-amber-200 bg-white text-amber-700',
    iconWrapper: 'bg-amber-50 text-amber-600',
    icon: AlertCircle,
  },
} as const;

function createToastId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 left-auto top-auto z-[100] flex w-[calc(100vw-3rem)] max-w-sm flex-col items-start gap-3">
      {toasts.map((toast) => {
        const styles = toneStyles[toast.tone];
        const Icon = styles.icon;

        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-soft ring-1 ring-black/5',
              styles.wrapper,
            )}
          >
            <span className={cn('mt-0.5 rounded-xl p-2', styles.iconWrapper)}>
              <Icon className="h-4 w-4" />
            </span>
            <p className="min-w-0 flex-1 leading-6 text-slate-700">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((payload: ToastPayload) => {
    setToasts((current) => [
      ...current.slice(-3),
      {
        id: createToastId(),
        tone: payload.tone ?? 'info',
        message: payload.message,
        duration: payload.duration ?? 4200,
      },
    ]);
  }, []);

  useEffect(() => {
    const timers = toasts.map((toast) => window.setTimeout(() => dismissToast(toast.id), toast.duration));

    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [dismissToast, toasts]);

  const value = useMemo(() => ({ showToast, dismissToast }), [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast harus digunakan di dalam ToastProvider');
  }

  return context;
}
