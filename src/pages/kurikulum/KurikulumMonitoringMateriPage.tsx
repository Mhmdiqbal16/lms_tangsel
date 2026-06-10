import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { useAppData } from '@/hooks/useAppData';
import { formatDateID } from '@/utils/date';

interface MaterialMonitoringRow {
  id: string;
  teacherName: string;
  className: string;
  subject: string;
  date: string;
  meeting: string;
  material: string;
  alignment: 'Sesuai' | 'Belum Diisi' | 'Perlu Cek';
}

export function KurikulumMonitoringMateriPage() {
  const { teacherAttendances, schedules, teachers, classes, subjects, learningMaterials } = useAppData();
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const rows: MaterialMonitoringRow[] = teacherAttendances
    .map((attendance) => {
      const schedule = schedules.find((item) => item.id === attendance.scheduleId);
      const material = learningMaterials.find(
        (item) => item.scheduleId === attendance.scheduleId && item.date === attendance.date,
      );
      return {
        id: attendance.id,
        teacherName: teachers.find((item) => item.id === attendance.teacherId)?.name ?? '-',
        className: classes.find((item) => item.id === schedule?.classId)?.name ?? '-',
        subject: subjects.find((item) => item.id === schedule?.subjectId)?.name ?? '-',
        date: attendance.date,
        meeting: material ? `Pertemuan ${material.meeting}` : '-',
        material: material?.title ?? 'Belum diisi',
        alignment: material?.alignmentStatus ?? 'Belum Diisi',
      };
    })
    .filter((item) => (teacherFilter === 'all' ? true : item.teacherName === teacherFilter))
    .filter((item) => (classFilter === 'all' ? true : item.className === classFilter))
    .filter((item) => (dateFilter ? item.date === dateFilter : true))
    .sort((first, second) => second.date.localeCompare(first.date));

  const columns: TableColumn<MaterialMonitoringRow>[] = [
    { key: 'teacherName', header: 'Guru', render: (item) => item.teacherName },
    { key: 'className', header: 'Kelas', render: (item) => item.className },
    { key: 'subject', header: 'Mapel', render: (item) => item.subject },
    { key: 'date', header: 'Tanggal', render: (item) => formatDateID(item.date) },
    { key: 'meeting', header: 'Pertemuan', render: (item) => item.meeting },
    { key: 'material', header: 'Materi', render: (item) => item.material },
    {
      key: 'alignment',
      header: 'Kesesuaian',
      render: (item) => (
        <Badge variant={item.alignment === 'Sesuai' ? 'green' : item.alignment === 'Perlu Cek' ? 'red' : 'yellow'}>
          {item.alignment}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring Materi"
        description="Kurikulum dapat memantau kelengkapan materi guru dan kesesuaiannya dengan jadwal."
      />

      <FilterBar>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Guru</span>
          <select
            value={teacherFilter}
            onChange={(event) => setTeacherFilter(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
          >
            <option value="all">Semua guru</option>
            {Array.from(new Set(rows.map((item) => item.teacherName))).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Kelas</span>
          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
          >
            <option value="all">Semua kelas</option>
            {Array.from(new Set(rows.map((item) => item.className))).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Tanggal</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
          />
        </label>
      </FilterBar>

      <DataTable
        data={rows}
        columns={columns}
        getRowKey={(item) => item.id}
        emptyTitle="Data monitoring materi belum ada"
        emptyDescription="Belum ada data materi yang sesuai dengan filter saat ini."
      />
    </div>
  );
}

