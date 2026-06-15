import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { formatDateID } from '@/utils/date';

interface TeachingHistoryRow {
  id: string;
  date: string;
  className: string;
  subject: string;
  material: string;
  attendanceStatus: string;
  journalCount: number;
}

export function GuruRiwayatPage() {
  const { session } = useAuth();
  const { teachers, teacherAttendances, schedules, classes, subjects, learningMaterials, studentJournals } = useAppData();
  const [searchTerm, setSearchTerm] = useState('');
  const teacher = teachers.find((item) => item.id === session?.referenceId);

  if (!teacher) {
    return null;
  }

  const baseRows: TeachingHistoryRow[] = teacherAttendances
    .filter((item) => item.teacherId === teacher.id)
    .map((attendance) => {
      const schedule = schedules.find((item) => item.id === attendance.scheduleId);
      const material = learningMaterials.find(
        (item) => item.scheduleId === attendance.scheduleId && item.date === attendance.date,
      );
      const journalCount = studentJournals.filter(
        (item) => item.scheduleId === attendance.scheduleId && item.date === attendance.date,
      ).length;
      return {
        id: attendance.id,
        date: attendance.date,
        className: classes.find((item) => item.id === schedule?.classId)?.name ?? '-',
        subject: subjects.find((item) => item.id === schedule?.subjectId)?.name ?? '-',
        material: material?.title ?? 'Belum diinput',
        attendanceStatus: attendance.status,
        journalCount,
      };
    })
    .sort((first, second) => second.date.localeCompare(first.date));

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const rows = baseRows.filter((item) => {
    if (!normalizedSearch) {
      return true;
    }

    return [
      item.className,
      item.subject,
      item.date,
      formatDateID(item.date),
      item.material,
      item.attendanceStatus,
      item.journalCount,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const columns: TableColumn<TeachingHistoryRow>[] = [
    { key: 'date', header: 'Tanggal', render: (item) => formatDateID(item.date) },
    { key: 'className', header: 'Kelas', render: (item) => item.className },
    { key: 'subject', header: 'Mapel', render: (item) => item.subject },
    { key: 'material', header: 'Materi', render: (item) => item.material },
    {
      key: 'attendanceStatus',
      header: 'Status Presensi',
      render: (item) => <Badge variant={item.attendanceStatus === 'Hadir' ? 'green' : 'yellow'}>{item.attendanceStatus}</Badge>,
    },
    { key: 'journalCount', header: 'Jumlah Jurnal Siswa Masuk', render: (item) => item.journalCount },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Mengajar"
        description="Rekap aktivitas mengajar berdasarkan presensi, materi, dan jumlah jurnal siswa yang masuk."
      />

      <FilterBar>
        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-3">
          <span>Cari Riwayat</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
            placeholder="Cari kelas, mapel, tanggal, materi, status, atau jumlah jurnal"
          />
        </label>
      </FilterBar>

      <DataTable
        data={rows}
        columns={columns}
        getRowKey={(item) => item.id}
        emptyTitle="Riwayat mengajar belum tersedia"
        emptyDescription="Belum ada riwayat mengajar pada data mock saat ini."
      />
    </div>
  );
}
