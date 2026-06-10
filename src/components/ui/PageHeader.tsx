interface PageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-brand-100 bg-white/95 p-6 shadow-soft md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">Sistem Monitoring Pembelajaran</p>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}

