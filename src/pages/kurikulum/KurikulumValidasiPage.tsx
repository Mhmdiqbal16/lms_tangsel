import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InfoAlert } from '@/components/ui/InfoAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppData } from '@/hooks/useAppData';
import { formatDateID } from '@/utils/date';

type ValidationRow = {
  id: string;
  type: 'Jurnal Siswa' | 'Materi Guru';
  source: 'journal' | 'material';
  sourceId: string;
  actorName: string;
  date: string;
  status: 'Menunggu' | 'Valid' | 'Ditolak';
  title: string;
  className: string;
  subject: string;
};

type ValidationConfirmation = {
  row: ValidationRow;
  status: 'Valid' | 'Ditolak';
};

export function KurikulumValidasiPage() {
  const {
    studentJournals,
    learningMaterials,
    students,
    teachers,
    schedules,
    classes,
    subjects,
    setJournalValidation,
    setMaterialValidation,
  } = useAppData();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [validationConfirmation, setValidationConfirmation] = useState<ValidationConfirmation | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'warning'; text: string } | null>(null);

  const rows: ValidationRow[] = [
    ...studentJournals.map((journal) => {
      const schedule = schedules.find((item) => item.id === journal.scheduleId);
      return {
        id: `journal-${journal.id}`,
        type: 'Jurnal Siswa' as const,
        source: 'journal' as const,
        sourceId: journal.id,
        actorName: students.find((item) => item.id === journal.studentId)?.name ?? '-',
        date: journal.date,
        status: journal.validationStatus,
        title: journal.materialStudied,
        className: classes.find((item) => item.id === schedule?.classId)?.name ?? '-',
        subject: subjects.find((item) => item.id === schedule?.subjectId)?.name ?? '-',
      };
    }),
    ...learningMaterials.map((material) => {
      const schedule = schedules.find((item) => item.id === material.scheduleId);
      return {
        id: `material-${material.id}`,
        type: 'Materi Guru' as const,
        source: 'material' as const,
        sourceId: material.id,
        actorName: teachers.find((item) => item.id === material.teacherId)?.name ?? '-',
        date: material.date,
        status: material.validationStatus,
        title: material.title,
        className: classes.find((item) => item.id === schedule?.classId)?.name ?? '-',
        subject: subjects.find((item) => item.id === schedule?.subjectId)?.name ?? '-',
      };
    }),
  ].sort((first, second) => second.date.localeCompare(first.date));

  const detail = rows.find((item) => item.id === detailId) ?? rows[0];

  const requestValidate = (row: ValidationRow, status: 'Valid' | 'Ditolak') => {
    setValidationConfirmation({ row, status });
  };

  const executeValidate = async (row: ValidationRow, status: 'Valid' | 'Ditolak') => {
    const pendingKey = `${row.source}-${row.sourceId}-${status}`;
    setPendingAction(pendingKey);
    const result =
      row.source === 'journal'
        ? await setJournalValidation(row.sourceId, status)
        : await setMaterialValidation(row.sourceId, status);
    setPendingAction(null);

    setMessage({
      tone: result.success ? 'success' : 'warning',
      text: result.success
        ? `${row.type} atas nama ${row.actorName} telah diubah menjadi status ${status}.`
        : result.message,
    });
    setValidationConfirmation(null);
  };

  const handleConfirmValidation = () => {
    if (!validationConfirmation) {
      return;
    }

    void executeValidate(validationConfirmation.row, validationConfirmation.status);
  };

  const validationConfirmationLoading = validationConfirmation
    ? pendingAction ===
      `${validationConfirmation.row.source}-${validationConfirmation.row.sourceId}-${validationConfirmation.status}`
    : false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Validasi Data"
        description="Kurikulum memvalidasi jurnal siswa dan materi guru langsung dari halaman monitoring."
      />

      {message ? <InfoAlert tone={message.tone} message={message.text} /> : null}

      {detail ? (
        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-500">{detail.type}</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{detail.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {detail.actorName} • {detail.className} • {detail.subject}
              </p>
            </div>
            <Badge variant={detail.status === 'Valid' ? 'green' : detail.status === 'Ditolak' ? 'red' : 'yellow'}>
              {detail.status}
            </Badge>
          </div>
        </section>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-soft">
        <div className="max-h-[560px] overflow-auto">
          <table className="min-w-full divide-y divide-brand-100">
            <thead className="bg-brand-50/70">
              <tr>
                {['Jenis Data', 'Aktor', 'Tanggal', 'Status Validasi', 'Aksi'].map((header) => (
                  <th
                    key={header}
                    className="sticky top-0 z-10 bg-brand-50 px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-brand-50/40">
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{row.type}</p>
                    <p className="mt-1 text-slate-500">{row.title}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <p>{row.actorName}</p>
                    <p className="mt-1 text-slate-500">
                      {row.className} • {row.subject}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{formatDateID(row.date)}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <Badge variant={row.status === 'Valid' ? 'green' : row.status === 'Ditolak' ? 'red' : 'yellow'}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => requestValidate(row, 'Valid')}
                        disabled={pendingAction !== null}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {pendingAction === `${row.source}-${row.sourceId}-Valid` ? 'Menyimpan...' : 'Validasi'}
                      </button>
                      <button
                        type="button"
                        onClick={() => requestValidate(row, 'Ditolak')}
                        disabled={pendingAction !== null}
                        className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {pendingAction === `${row.source}-${row.sourceId}-Ditolak` ? 'Menyimpan...' : 'Tolak'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailId(row.id)}
                        className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
                      >
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(validationConfirmation)}
        title={
          validationConfirmation?.status === 'Valid'
            ? `Validasi ${validationConfirmation.row.type}?`
            : `Tolak ${validationConfirmation?.row.type ?? 'data'}?`
        }
        description={
          validationConfirmation
            ? `${validationConfirmation.row.type} atas nama ${validationConfirmation.row.actorName} akan diubah menjadi status ${validationConfirmation.status}.`
            : 'Status data akan diperbarui.'
        }
        tone={validationConfirmation?.status === 'Ditolak' ? 'danger' : 'success'}
        confirmLabel={validationConfirmationLoading ? 'Menyimpan...' : 'Konfirmasi'}
        isLoading={validationConfirmationLoading}
        onConfirm={handleConfirmValidation}
        onCancel={() => setValidationConfirmation(null)}
      />
    </div>
  );
}
