import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { formatDateID } from '@/utils/date';

interface JournalRow {
  id: string;
  studentName: string;
  className: string;
  subject: string;
  date: string;
  summary: string;
  status: string;
}

export function GuruJurnalSiswaPage() {
  const { session } = useAuth();
  const { teachers, studentJournals, schedules, students, classes, subjects } = useAppData();
  const teacher = teachers.find((item) => item.id === session?.referenceId);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  if (!teacher) {
    return null;
  }

  const baseRows: JournalRow[] = studentJournals
    .filter((journal) => {
      const schedule = schedules.find((item) => item.id === journal.scheduleId);
      return schedule?.teacherId === teacher.id;
    })
    .map((journal) => {
      const schedule = schedules.find((item) => item.id === journal.scheduleId);
      return {
        id: journal.id,
        studentName: students.find((item) => item.id === journal.studentId)?.name ?? '-',
        className: classes.find((item) => item.id === schedule?.classId)?.name ?? '-',
        subject: subjects.find((item) => item.id === schedule?.subjectId)?.name ?? '-',
        date: journal.date,
        summary: journal.summary,
        status: journal.reviewStatus,
      };
    })
    .sort((first, second) => second.date.localeCompare(first.date));

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const rows = baseRows
    .filter((item) => (classFilter === 'all' ? true : item.className === classFilter))
    .filter((item) => (subjectFilter === 'all' ? true : item.subject === subjectFilter))
    .filter((item) => (dateFilter ? item.date === dateFilter : true))
    .filter((item) => {
      if (!normalizedSearch) {
        return true;
      }

      return [item.studentName, item.className, item.subject, item.date, formatDateID(item.date), item.summary, item.status]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });

  const classOptions = Array.from(new Set(baseRows.map((item) => item.className)));
  const subjectOptions = Array.from(new Set(baseRows.map((item) => item.subject)));

  const columns: TableColumn<JournalRow>[] = [
    { key: 'studentName', header: 'Nama Siswa', render: (item) => item.studentName },
    { key: 'className', header: 'Kelas', render: (item) => item.className },
    { key: 'subject', header: 'Mapel', render: (item) => item.subject },
    { key: 'date', header: 'Tanggal', render: (item) => formatDateID(item.date) },
    { key: 'summary', header: 'Rangkuman', render: (item) => item.summary },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'Tervalidasi' ? 'green' : item.status === 'Perlu Revisi' ? 'red' : 'blue'}>
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jurnal Siswa"
        description="Guru dapat melihat jurnal siswa dari kelas dan mata pelajaran yang diajarkan."
      />

      <FilterBar>
        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-3">
          <span>Cari Jurnal</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
            placeholder="Cari siswa, kelas, mapel, tanggal, rangkuman, atau status"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Kelas</span>
          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
          >
            <option value="all">Semua kelas</option>
            {classOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Mata Pelajaran</span>
          <select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
          >
            <option value="all">Semua mapel</option>
            {subjectOptions.map((item) => (
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
        emptyTitle="Belum ada jurnal siswa"
        emptyDescription="Belum ada jurnal yang cocok dengan kelas, mapel, atau tanggal yang dipilih."
      />
    </div>
  );
}
