import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { academicDateReference } from '@/data/mockData';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { StudentAttendance } from '@/types';
import { formatDateID, formatMonthYear, getMonthKey } from '@/utils/date';

type AttendanceRow = StudentAttendance & {
  subjectName: string;
  teacherName: string;
  timeRange: string;
};

const statusVariantMap = {
  Hadir: 'green',
  Izin: 'yellow',
  Alfa: 'red',
} as const;

export function SiswaAbsensiPage() {
  const { session } = useAuth();
  const { students, studentAttendances, schedules, subjects, teachers } = useAppData();
  const student = students.find((item) => item.id === session?.referenceId);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(getMonthKey(academicDateReference));

  const rows: AttendanceRow[] =
    studentAttendances
      .filter((item) => item.studentId === student?.id)
      .map((item) => {
        const schedule = schedules.find((scheduleItem) => scheduleItem.id === item.scheduleId);
        const subject = subjects.find((subjectItem) => subjectItem.id === schedule?.subjectId);
        const teacher = teachers.find((teacherItem) => teacherItem.id === schedule?.teacherId);

        return {
          ...item,
          subjectName: subject?.name ?? '-',
          teacherName: teacher?.name ?? '-',
          timeRange: schedule ? `${schedule.startTime} - ${schedule.endTime}` : '-',
        };
      })
      .filter((item) => (subjectFilter === 'all' ? true : item.subjectName === subjectFilter))
      .filter((item) => getMonthKey(item.date) === monthFilter) ?? [];

  const subjectOptions = Array.from(new Set(studentAttendances
    .filter((item) => item.studentId === student?.id)
    .map((item) => {
      const schedule = schedules.find((scheduleItem) => scheduleItem.id === item.scheduleId);
      return subjects.find((subjectItem) => subjectItem.id === schedule?.subjectId)?.name ?? '-';
    })));

  const monthOptions = Array.from(
    new Set(studentAttendances.filter((item) => item.studentId === student?.id).map((item) => getMonthKey(item.date))),
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
            {monthOptions.map((monthKey) => (
              <option key={monthKey} value={monthKey}>
                {formatMonthYear(`${monthKey}-01`)}
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

