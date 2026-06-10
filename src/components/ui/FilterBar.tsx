interface FilterBarProps {
  children: React.ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="grid gap-4 rounded-3xl border border-brand-100 bg-white p-5 shadow-soft md:grid-cols-3">
      {children}
    </div>
  );
}

