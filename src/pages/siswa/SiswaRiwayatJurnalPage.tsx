import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { academicDateReference } from '@/data/mockData';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { getJournalEligibility } from '@/utils/businessRules';
import { formatDateID, formatMonthYear, getMonthKey } from '@/utils/date';

interface HistoryRow {
  id: string;
  date: string;
  subject: string;
  material: string;
  entryStatus: 'Selesai' | 'Belum Diisi' | 'Terkunci';
  reviewStatus: string;
  notes: string;
}

const entryVariantMap = {
  Selesai: 'green',
  'Belum Diisi': 'yellow',
  Terkunci: 'red',
} as const;

export function SiswaRiwayatJurnalPage() {
  const { session } = useAuth();
  const { students, studentAttendances, studentJournals, assessments, questionnaires, schedules, subjects, learningMaterials } =
    useAppData();
  const student = students.find((item) => item.id === session?.referenceId);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  const historySessions = new Map<string, { scheduleId: string; date: string }>();

  studentAttendances
    .filter((attendance) => attendance.studentId === student?.id)
    .forEach((attendance) => {
      historySessions.set(`${attendance.scheduleId}-${attendance.date}`, {
        scheduleId: attendance.scheduleId,
        date: attendance.date,
      });
    });

  studentJournals
    .filter((journal) => journal.studentId === student?.id)
    .forEach((journal) => {
      historySessions.set(`${journal.scheduleId}-${journal.date}`, {
        scheduleId: journal.scheduleId,
        date: journal.date,
      });
    });

  const rawRows: HistoryRow[] = Array.from(historySessions.values()).map((historySession) => {
    const schedule = schedules.find((item) => item.id === historySession.scheduleId);
    const subject = subjects.find((item) => item.id === schedule?.subjectId);
    const journal = studentJournals.find(
      (item) =>
        item.studentId === student?.id &&
        item.scheduleId === historySession.scheduleId &&
        item.date === historySession.date,
    );
    const material = learningMaterials.find(
      (item) => item.scheduleId === historySession.scheduleId && item.date === historySession.date,
    );
    const eligibility = getJournalEligibility({
      studentId: student?.id ?? '',
      scheduleId: historySession.scheduleId,
      sessionDate: historySession.date,
      journals: studentJournals,
      assessments,
      questionnaires,
      currentDate: academicDateReference,
    });

    return {
      id: `${historySession.scheduleId}-${historySession.date}`,
      date: historySession.date,
      subject: subject?.name ?? '-',
      material: journal?.materialStudied ?? material?.title ?? '-',
      entryStatus: (journal ? 'Selesai' : eligibility.locked ? 'Terkunci' : 'Belum Diisi') as HistoryRow['entryStatus'],
      reviewStatus: journal?.reviewStatus ?? '-',
      notes: journal?.notes ?? (eligibility.locked ? 'Lewat batas H+1.' : 'Menunggu pengisian jurnal.'),
    };
  });

  const rows = rawRows
    .filter((item) => (subjectFilter === 'all' ? true : item.subject === subjectFilter))
    .filter((item) => (monthFilter === 'all' ? true : getMonthKey(item.date) === monthFilter))
    .sort((first, second) => second.date.localeCompare(first.date));

  const columns: TableColumn<HistoryRow>[] = [
    { key: 'date', header: 'Tanggal', render: (item) => formatDateID(item.date) },
    { key: 'subject', header: 'Mapel', render: (item) => item.subject },
    { key: 'material', header: 'Materi', render: (item) => item.material },
    {
      key: 'entryStatus',
      header: 'Status Pengisian',
      render: (item) => <Badge variant={entryVariantMap[item.entryStatus]}>{item.entryStatus}</Badge>,
    },
    {
      key: 'reviewStatus',
      header: 'Status Review',
      render: (item) => <Badge variant={item.reviewStatus === 'Tervalidasi' ? 'green' : item.reviewStatus === 'Perlu Revisi' ? 'red' : 'blue'}>{item.reviewStatus}</Badge>,
    },
    { key: 'notes', header: 'Keterangan', render: (item) => item.notes },
  ];

  const subjectOptions = Array.from(
    new Set(
      rawRows.map((item) => item.subject),
    ),
  );

  const monthOptions = Array.from(new Set(rawRows.map((item) => getMonthKey(item.date)))).sort((first, second) =>
    second.localeCompare(first),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Jurnal"
        description="Riwayat pengisian jurnal siswa, termasuk status pengisian dan proses review."
      />

      <FilterBar>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Mata Pelajaran</span>
          <select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
          >
            <option value="all">Semua mata pelajaran</option>
            {subjectOptions.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Bulan</span>
          <select
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
          >
            <option value="all">Semua bulan</option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {formatMonthYear(`${month}-01`)}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-2xl bg-brand-50/70 p-4">
          <p className="text-sm font-semibold text-brand-700">Jurnal tercatat</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{rows.length}</p>
          <p className="mt-1 text-sm text-slate-500">Baris riwayat sesuai filter aktif.</p>
        </div>
      </FilterBar>

      <DataTable
        data={rows}
        columns={columns}
        getRowKey={(item) => item.id}
        emptyTitle="Belum ada riwayat jurnal"
        emptyDescription="Belum ada data jurnal yang cocok dengan filter saat ini."
      />
    </div>
  );
}
