import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
}

export function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border border-brand-100 bg-white p-5 shadow-soft"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">Ringkas</span>
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </motion.div>
  );
}

