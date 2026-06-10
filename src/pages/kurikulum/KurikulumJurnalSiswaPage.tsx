import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { useAppData } from '@/hooks/useAppData';
import { formatDateID } from '@/utils/date';

interface CurriculumJournalRow {
  id: string;
  studentName: string;
  className: string;
  subject: string;
  date: string;
  journalStatus: string;
  alignment: string;
}

export function KurikulumJurnalSiswaPage() {
  const { studentJournals, students, schedules, classes, subjects, learningMaterials } = useAppData();
  const [classFilter, setClassFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const rows: CurriculumJournalRow[] = studentJournals
    .map((journal) => {
      const schedule = schedules.find((item) => item.id === journal.scheduleId);
      const material = learningMaterials.find((item) => item.scheduleId === journal.scheduleId && item.date === journal.date);
      return {
        id: journal.id,
        studentName: students.find((item) => item.id === journal.studentId)?.name ?? '-',
        className: classes.find((item) => item.id === schedule?.classId)?.name ?? '-',
        subject: subjects.find((item) => item.id === schedule?.subjectId)?.name ?? '-',
        date: journal.date,
        journalStatus: journal.reviewStatus,
        alignment: material
          ? material.validationStatus === 'Ditolak' || journal.validationStatus === 'Ditolak'
            ? 'Perlu Review'
            : 'Sesuai'
          : 'Belum Ada Materi',
      };
    })
    .filter((item) => (classFilter === 'all' ? true : item.className === classFilter))
    .filter((item) => (subjectFilter === 'all' ? true : item.subject === subjectFilter))
    .filter((item) => (dateFilter ? item.date === dateFilter : true))
    .sort((first, second) => second.date.localeCompare(first.date));

  const columns: TableColumn<CurriculumJournalRow>[] = [
    { key: 'studentName', header: 'Siswa', render: (item) => item.studentName },
    { key: 'className', header: 'Kelas', render: (item) => item.className },
    { key: 'subject', header: 'Mapel', render: (item) => item.subject },
    { key: 'date', header: 'Tanggal', render: (item) => formatDateID(item.date) },
    {
      key: 'journalStatus',
      header: 'Status Jurnal',
      render: (item) => (
        <Badge variant={item.journalStatus === 'Tervalidasi' ? 'green' : item.journalStatus === 'Perlu Revisi' ? 'red' : 'blue'}>
          {item.journalStatus}
        </Badge>
      ),
    },
    {
      key: 'alignment',
      header: 'Kesesuaian Materi Guru',
      render: (item) => (
        <Badge variant={item.alignment === 'Sesuai' ? 'green' : item.alignment === 'Perlu Review' ? 'red' : 'yellow'}>
          {item.alignment}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring Jurnal Siswa"
        description="Kurikulum memonitor status jurnal siswa dan kesesuaiannya dengan materi guru."
      />

      <FilterBar>
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
          <span>Mata Pelajaran</span>
          <select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
          >
            <option value="all">Semua mapel</option>
            {Array.from(new Set(rows.map((item) => item.subject))).map((item) => (
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
        emptyTitle="Jurnal siswa belum tersedia"
        emptyDescription="Belum ada jurnal yang cocok dengan filter saat ini."
      />
    </div>
  );
}

