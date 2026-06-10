import { FileSearch } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  getRowKey: (item: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  maxHeight?: string;
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  emptyTitle = 'Data belum tersedia',
  emptyDescription = 'Belum ada informasi yang bisa ditampilkan pada tabel ini.',
  maxHeight = 'max-h-[560px]',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={FileSearch} />;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-soft">
      <div className={`overflow-auto ${maxHeight}`}>
        <table className="min-w-full divide-y divide-brand-100">
          <thead className="bg-brand-50/70">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="sticky top-0 z-10 bg-brand-50 px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr key={getRowKey(item)} className="align-top transition hover:bg-brand-50/40">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-4 text-sm text-slate-700 ${column.className ?? ''}`}>
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
