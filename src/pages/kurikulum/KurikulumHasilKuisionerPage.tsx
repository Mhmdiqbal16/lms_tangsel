import { useState } from 'react';
import { BarChart3, ClipboardList, FileSearch, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { useAppData } from '@/hooks/useAppData';
import type { QuestionnaireRatingKey, QuestionnaireRatings } from '@/types';
import { formatDateID } from '@/utils/date';

const ratingLabels: Record<QuestionnaireRatingKey, string> = {
  clarity: 'Kejelasan',
  interaction: 'Interaksi',
  discipline: 'Disiplin',
  support: 'Bimbingan',
};

const ratingKeys = Object.keys(ratingLabels) as QuestionnaireRatingKey[];

interface QuestionnaireResultRow {
  id: string;
  classId: string;
  className: string;
  studentName: string;
  teacherName: string;
  subject: string;
  date: string;
  ratings: Partial<QuestionnaireRatings>;
  average: number | null;
  note: string;
}

interface ClassSummaryRow {
  id: string;
  className: string;
  count: number;
  average: number | null;
}

function getRatingAverage(ratings?: Partial<QuestionnaireRatings>) {
  const values = ratingKeys
    .map((key) => ratings?.[key])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatAverage(value: number | null) {
  return value === null ? '-' : value.toFixed(1);
}

export function KurikulumHasilKuisionerPage() {
  const { questionnaires, students, teachers, schedules, classes, subjects } = useAppData();
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const resultRows: QuestionnaireResultRow[] = questionnaires
    .filter((questionnaire) => questionnaire.completed)
    .map((questionnaire) => {
      const schedule = schedules.find((item) => item.id === questionnaire.scheduleId);
      const classItem = classes.find((item) => item.id === schedule?.classId);
      const ratings = questionnaire.ratings ?? {};

      return {
        id: questionnaire.id,
        classId: classItem?.id ?? '',
        className: classItem?.name ?? '-',
        studentName: students.find((item) => item.id === questionnaire.studentId)?.name ?? '-',
        teacherName: teachers.find((item) => item.id === questionnaire.teacherId)?.name ?? '-',
        subject: subjects.find((item) => item.id === schedule?.subjectId)?.name ?? '-',
        date: questionnaire.date,
        ratings,
        average: getRatingAverage(ratings),
        note: questionnaire.note ?? '',
      };
    })
    .sort((first, second) => second.date.localeCompare(first.date));

  const classSummaries: ClassSummaryRow[] = classes
    .map((classItem) => {
      const classRows = resultRows.filter((row) => row.classId === classItem.id);
      const averages = classRows
        .map((row) => row.average)
        .filter((value): value is number => typeof value === 'number');

      return {
        id: classItem.id,
        className: classItem.name,
        count: classRows.length,
        average:
          averages.length > 0 ? averages.reduce((total, value) => total + value, 0) / averages.length : null,
      };
    })
    .filter((item) => item.count > 0)
    .sort((first, second) => first.className.localeCompare(second.className));

  const selectedClass = selectedClassId === 'all' ? null : classSummaries.find((item) => item.id === selectedClassId);
  const activeClassId = selectedClassId === 'all' || selectedClass ? selectedClassId : 'all';
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRows = resultRows
    .filter((row) => (activeClassId === 'all' ? true : row.classId === activeClassId))
    .filter((row) => {
      if (!normalizedSearch) {
        return true;
      }

      return [row.className, row.studentName, row.teacherName, row.subject, row.date, row.note]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });

  const allAverages = resultRows
    .map((row) => row.average)
    .filter((value): value is number => typeof value === 'number');
  const overallAverage =
    allAverages.length > 0 ? allAverages.reduce((total, value) => total + value, 0) / allAverages.length : null;
  const filteredAverages = filteredRows
    .map((row) => row.average)
    .filter((value): value is number => typeof value === 'number');
  const filteredAverage =
    filteredAverages.length > 0
      ? filteredAverages.reduce((total, value) => total + value, 0) / filteredAverages.length
      : null;
  const activeClassLabel = selectedClass?.className ?? 'Semua kelas';

  const columns: TableColumn<QuestionnaireResultRow>[] = [
    { key: 'date', header: 'Tanggal', render: (item) => formatDateID(item.date) },
    { key: 'className', header: 'Kelas', render: (item) => item.className },
    { key: 'studentName', header: 'Siswa', render: (item) => item.studentName },
    { key: 'teacherName', header: 'Guru', render: (item) => item.teacherName },
    { key: 'subject', header: 'Mapel', render: (item) => item.subject },
    {
      key: 'average',
      header: 'Rata-rata',
      render: (item) => (
        <Badge variant={item.average === null ? 'slate' : item.average >= 4 ? 'green' : item.average >= 3 ? 'yellow' : 'red'}>
          {formatAverage(item.average)}
        </Badge>
      ),
    },
    {
      key: 'ratings',
      header: 'Detail Nilai',
      className: 'min-w-[280px]',
      render: (item) => (
        <div className="grid gap-2">
          {ratingKeys.map((key) => (
            <div key={`${item.id}-${key}`} className="flex items-center justify-between gap-3">
              <span className="text-slate-500">{ratingLabels[key]}</span>
              <span className="font-semibold text-slate-900">{item.ratings[key] ?? '-'}</span>
            </div>
          ))}
        </div>
      ),
    },
    { key: 'note', header: 'Catatan', render: (item) => item.note || '-' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hasil Kuisioner"
        description="Kurikulum memonitor hasil kuisioner guru yang diisi siswa pada setiap kelas."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <StatCard
          title="Kuisioner Masuk"
          value={resultRows.length}
          description="Total kuisioner guru yang sudah dikirim siswa."
          icon={ClipboardList}
        />
        <StatCard
          title="Kelas Terpantau"
          value={classSummaries.length}
          description="Jumlah kelas yang sudah memiliki hasil kuisioner."
          icon={Users}
        />
        <StatCard
          title="Rata-rata Nilai"
          value={formatAverage(overallAverage)}
          description="Rata-rata semua aspek penilaian kuisioner."
          icon={BarChart3}
        />
      </div>

      <FilterBar>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Filter Kelas</span>
          <select
            value={activeClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
          >
            <option value="all">Semua kelas</option>
            {classSummaries.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.className} - {classItem.count} kuisioner
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Cari Hasil Kuisioner</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
            placeholder="Cari kelas, siswa, guru, mapel, tanggal, atau catatan"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedClassId('all');
            }}
            className="w-full rounded-2xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Reset Filter
          </button>
        </div>
      </FilterBar>

      {classSummaries.length === 0 ? (
        <EmptyState
          title="Hasil kuisioner belum tersedia"
          description="Belum ada kuisioner guru yang selesai diisi siswa."
          icon={FileSearch}
        />
      ) : (
        <div className="space-y-6">
          <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Ringkasan Kelas</h2>
                <p className="mt-1 text-sm text-slate-500">Pilih kelas atau lihat semua hasil kuisioner.</p>
              </div>
              <Badge variant="blue">{classSummaries.length} kelas</Badge>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <button
                type="button"
                onClick={() => setSelectedClassId('all')}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  activeClassId === 'all'
                    ? 'border-brand-600 bg-brand-50 shadow-soft'
                    : 'border-brand-100 bg-white hover:border-brand-300 hover:bg-brand-50/50'
                }`}
              >
                <p className="text-lg font-semibold text-slate-900">Semua kelas</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="green">{resultRows.length} kuisioner</Badge>
                  <Badge variant="blue">Rata-rata {formatAverage(overallAverage)}</Badge>
                </div>
              </button>
              {classSummaries.map((classItem) => (
                <button
                  key={classItem.id}
                  type="button"
                  onClick={() => setSelectedClassId(classItem.id)}
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    activeClassId === classItem.id
                      ? 'border-brand-600 bg-brand-50 shadow-soft'
                      : 'border-brand-100 bg-white hover:border-brand-300 hover:bg-brand-50/50'
                  }`}
                >
                  <p className="text-lg font-semibold text-slate-900">{classItem.className}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="green">{classItem.count} kuisioner</Badge>
                    <Badge variant="blue">Rata-rata {formatAverage(classItem.average)}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-500">Filter Aktif</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">{activeClassLabel}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="green">{filteredRows.length} kuisioner tampil</Badge>
                <Badge variant="blue">Rata-rata {formatAverage(filteredAverage)}</Badge>
              </div>
            </div>

            <DataTable
              data={filteredRows}
              columns={columns}
              getRowKey={(item) => item.id}
              emptyTitle="Tidak ada hasil kuisioner"
              emptyDescription="Belum ada kuisioner yang sesuai dengan kelas atau pencarian saat ini."
              maxHeight="max-h-[680px]"
            />
          </section>
        </div>
      )}
    </div>
  );
}
