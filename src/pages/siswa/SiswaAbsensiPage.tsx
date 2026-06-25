import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { useStudentLearningSessions } from '@/pages/siswa/useStudentLearningSessions';
import { StudentAttendanceStatus } from '@/types';
import { formatDateID, formatMonthYear, getMonthKey } from '@/utils/date';

type AttendanceDisplayStatus = StudentAttendanceStatus | 'Belum Absensi';

interface AttendanceRow {
  id: string;
  date: string;
  status: AttendanceDisplayStatus;
  subjectName: string;
  teacherName: string;
  timeRange: string;
  startTime: string;
}

const statusVariantMap = {
  Hadir: 'green',
  Izin: 'yellow',
  Alfa: 'red',
  'Belum Absensi': 'slate',
} as const;

export function SiswaAbsensiPage() {
  const { student, studentAttendances, historySessions } = useStudentLearningSessions();
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<AttendanceDisplayStatus | 'all'>('all');

  const rawRows: AttendanceRow[] = historySessions.map((learningSession) => {
    const attendance = studentAttendances.find(
      (item) =>
        item.studentId === student?.id &&
        item.scheduleId === learningSession.schedule.id &&
        item.date === learningSession.sessionDate,
    );

    return {
      id: learningSession.key,
      date: learningSession.sessionDate,
      status: attendance?.status ?? 'Belum Absensi',
      subjectName: learningSession.subject?.name ?? 'Jadwal tidak ditemukan',
      teacherName: learningSession.teacher?.name ?? '-',
      timeRange: `${learningSession.schedule.startTime} - ${learningSession.schedule.endTime}`,
      startTime: learningSession.schedule.startTime,
    };
  });

  const rowsBeforeStatusFilter = rawRows
    .filter((item) => (subjectFilter === 'all' ? true : item.subjectName === subjectFilter))
    .filter((item) => (monthFilter === 'all' ? true : getMonthKey(item.date) === monthFilter));

  const rows = rowsBeforeStatusFilter
    .filter((item) => (statusFilter === 'all' ? true : item.status === statusFilter))
    .sort((first, second) => second.date.localeCompare(first.date) || first.startTime.localeCompare(second.startTime));

  const subjectOptions = Array.from(new Set(rawRows.map((item) => item.subjectName)));
  const monthOptions = Array.from(new Set(rawRows.map((item) => getMonthKey(item.date)))).sort((first, second) =>
    second.localeCompare(first),
  );
  const statusOptions: AttendanceDisplayStatus[] = ['Hadir', 'Izin', 'Alfa', 'Belum Absensi'];
  const statusCounts = statusOptions.reduce(
    (result, status) => ({
      ...result,
      [status]: rowsBeforeStatusFilter.filter((item) => item.status === status).length,
    }),
    {} as Record<AttendanceDisplayStatus, number>,
  );

  const columns: TableColumn<AttendanceRow>[] = [
    { key: 'date', header: 'Tanggal', render: (item) => formatDateID(item.date) },
    { key: 'subject', header: 'Mata Pelajaran', render: (item) => item.subjectName },
    { key: 'teacher', header: 'Guru', render: (item) => item.teacherName },
    { key: 'time', header: 'Jam', render: (item) => item.timeRange },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <Badge variant={statusVariantMap[item.status]}>{item.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Absensi Siswa"
        description="Riwayat kehadiran berdasarkan mata pelajaran yang diterima oleh siswa."
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
            {monthOptions.map((monthKey) => (
              <option key={monthKey} value={monthKey}>
                {formatMonthYear(`${monthKey}-01`)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as AttendanceDisplayStatus | 'all')}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
          >
            <option value="all">Semua status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-2xl bg-brand-50/70 p-4">
          <p className="text-sm font-semibold text-brand-700">Total data tampil</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{rows.length}</p>
          <p className="mt-1 text-sm text-slate-500">Baris absensi sesuai filter aktif.</p>
        </div>
      </FilterBar>

      <div className="grid gap-4 md:grid-cols-4">
        {statusOptions.map((status) => (
          <div key={status} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{status}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{statusCounts[status]}</p>
          </div>
        ))}
      </div>

      <DataTable
        data={rows}
        columns={columns}
        getRowKey={(item) => item.id}
        emptyTitle="Belum ada data absensi"
        emptyDescription="Coba ubah filter mata pelajaran atau bulan untuk melihat data lain."
      />
    </div>
  );
}
