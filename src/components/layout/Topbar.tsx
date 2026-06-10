import { CalendarDays, LogOut, Menu } from 'lucide-react';
import { academicDateReference } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { formatDateID } from '@/utils/date';
import { getInitials, getRoleLabel } from '@/utils/helpers';

interface TopbarProps {
  onOpenSidebar: () => void;
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const { session, logout } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <header className="glass-panel sticky top-0 z-30 border-b border-brand-100 px-4 py-4 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-2xl border border-brand-100 bg-white p-3 text-slate-700 shadow-sm transition hover:bg-brand-50 lg:hidden"
            aria-label="Buka sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-sm font-semibold text-slate-900">Selamat datang, {session.name}</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays className="h-4 w-4 text-brand-500" />
              <span>Hari aktif sekolah: {formatDateID(academicDateReference)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-sm font-bold text-white">
              {getInitials(session.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{session.name}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-brand-500">{getRoleLabel(session.role)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

