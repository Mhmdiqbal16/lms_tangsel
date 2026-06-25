import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { menusByRole } from '@/data/menu';
import { useAuth } from '@/hooks/useAuth';
import { getRoleAccessHighlights } from '@/utils/accessControl';
import { cn, getRoleLabel } from '@/utils/helpers';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const { session, hasPermission } = useAuth();

  if (!session) {
    return null;
  }

  const menus = menusByRole[session.role].filter((item) => hasPermission(item.permission));
  const accessHighlights = getRoleAccessHighlights(session.role);

  return (
    <div className="flex h-full flex-col bg-white px-5 py-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logosmk.webp" alt="Logo SMKN 2" className="h-12 w-12 object-contain" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-500">Portal Akademik SMKN 2</p>
            <h2 className="text-lg font-bold text-slate-900">Monitoring Pembelajaran</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-brand-100 p-2 text-slate-500 transition hover:bg-brand-50 lg:hidden"
          aria-label="Tutup sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-3xl bg-brand-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">Role Aktif</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">{getRoleLabel(session.role)}</p>
        <p className="mt-1 text-sm text-slate-600">{accessHighlights[0]}</p>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-2">
        {menus.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-600 text-white shadow-soft'
                    : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700',
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

    </div>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden min-h-screen w-[304px] shrink-0 self-stretch border-r border-brand-100 bg-white lg:block">
        <SidebarContent onClose={onClose} />
      </aside>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
            />
            <motion.aside
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 w-[304px] border-r border-brand-100 bg-white shadow-2xl lg:hidden"
            >
              <SidebarContent onClose={onClose} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
