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
  const [searchTerm, setSearchTerm] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const teachingSessions = new Map<string, { scheduleId: string; date: string; teacherId: string }>();

  teacherAttendances.forEach((attendance) => {
    teachingSessions.set(`${attendance.scheduleId}-${attendance.date}`, {
      scheduleId: attendance.scheduleId,
      date: attendance.date,
      teacherId: attendance.teacherId,
    });
  });

  learningMaterials.forEach((material) => {
    const schedule = schedules.find((item) => item.id === material.scheduleId);
    teachingSessions.set(`${material.scheduleId}-${material.date}`, {
      scheduleId: material.scheduleId,
      date: material.date,
      teacherId: material.teacherId || schedule?.teacherId || '',
    });
  });

  const baseRows: MaterialMonitoringRow[] = Array.from(teachingSessions.values())
    .map((session) => {
      const schedule = schedules.find((item) => item.id === session.scheduleId);
      const attendance = teacherAttendances.find(
        (item) => item.scheduleId === session.scheduleId && item.date === session.date,
      );
      const material = learningMaterials.find(
        (item) => item.scheduleId === session.scheduleId && item.date === session.date,
      );
      return {
        id: `${session.scheduleId}-${session.date}`,
        teacherName: teachers.find((item) => item.id === (material?.teacherId ?? attendance?.teacherId ?? session.teacherId))?.name ?? '-',
        className: classes.find((item) => item.id === schedule?.classId)?.name ?? '-',
        subject: subjects.find((item) => item.id === schedule?.subjectId)?.name ?? '-',
        date: session.date,
        meeting: material ? `Pertemuan ${material.meeting}` : '-',
        material: material?.title ?? 'Belum diisi',
        alignment: material?.alignmentStatus ?? 'Belum Diisi',
      };
    })
    .sort((first, second) => second.date.localeCompare(first.date));

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const rows = baseRows
    .filter((item) => (teacherFilter === 'all' ? true : item.teacherName === teacherFilter))
    .filter((item) => (classFilter === 'all' ? true : item.className === classFilter))
    .filter((item) => (dateFilter ? item.date === dateFilter : true))
    .filter((item) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        item.teacherName,
        item.className,
        item.subject,
        item.date,
        formatDateID(item.date),
        item.meeting,
        item.material,
        item.alignment,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });

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
        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-3">
          <span>Cari</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
            placeholder="Cari guru, kelas, mapel, materi, tanggal, atau status"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Guru</span>
          <select
            value={teacherFilter}
            onChange={(event) => setTeacherFilter(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
          >
            <option value="all">Semua guru</option>
            {Array.from(new Set(baseRows.map((item) => item.teacherName))).map((item) => (
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
            {Array.from(new Set(baseRows.map((item) => item.className))).map((item) => (
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
