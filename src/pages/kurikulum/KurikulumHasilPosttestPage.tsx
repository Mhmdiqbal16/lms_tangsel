import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { useAppData } from '@/hooks/useAppData';
import type { AssessmentRecord } from '@/types';
import { formatDateID } from '@/utils/date';
import { BookOpenCheck, ClipboardCheck, FileSearch, Users } from 'lucide-react';

interface PosttestStudentResultRow {
  id: string;
  studentName: string;
  completed: boolean;
  score?: number;
  totalQuestions: number;
  answers: NonNullable<AssessmentRecord['studentStatuses'][number]['answers']>;
}

function getAssessmentLabel(
  assessment: AssessmentRecord,
  classes: ReturnType<typeof useAppData>['classes'],
  subjects: ReturnType<typeof useAppData>['subjects'],
) {
  const className = classes.find((item) => item.id === assessment.classId)?.name ?? '-';
  const subjectName = subjects.find((item) => item.id === assessment.subjectId)?.name ?? '-';
  return `${subjectName} - ${className} - Pertemuan ${assessment.meeting} - ${formatDateID(assessment.date)}`;
}

function getStudentScore(status: AssessmentRecord['studentStatuses'][number]) {
  const answers = status.answers ?? [];
  if (answers.length > 0) {
    return answers.filter((answer) => answer.correct).length;
  }

  return typeof status.score === 'number' ? status.score : undefined;
}

export function KurikulumHasilPosttestPage() {
  const { assessments, students, teachers, classes, subjects } = useAppData();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const posttestAssessments = assessments
    .filter((assessment) => assessment.type === 'posttest')
    .slice()
    .sort((first, second) => second.date.localeCompare(first.date) || second.meeting - first.meeting);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredAssessments = posttestAssessments
    .filter((assessment) => (classFilter === 'all' ? true : assessment.classId === classFilter))
    .filter((assessment) => (subjectFilter === 'all' ? true : assessment.subjectId === subjectFilter))
    .filter((assessment) => {
      if (!normalizedSearch) {
        return true;
      }

      const teacherName = teachers.find((teacher) => teacher.id === assessment.teacherId)?.name ?? '';
      return `${getAssessmentLabel(assessment, classes, subjects)} ${teacherName}`.toLowerCase().includes(normalizedSearch);
    });

  const selectedAssessment =
    filteredAssessments.find((assessment) => assessment.id === selectedAssessmentId) ?? filteredAssessments[0];
  const completedStatuses = posttestAssessments.flatMap((assessment) =>
    assessment.studentStatuses.filter((status) => status.completed),
  );
  const completedResultScores = posttestAssessments.flatMap((assessment) =>
    assessment.studentStatuses
      .filter((status) => status.completed && (typeof status.score === 'number' || (status.answers?.length ?? 0) > 0))
      .map((status) => {
        const score = getStudentScore(status) ?? 0;
        return Math.round((score / Math.max(assessment.questions.length, 1)) * 100);
      }),
  );
  const averageScore =
    completedResultScores.length > 0
      ? Math.round(completedResultScores.reduce((total, score) => total + score, 0) / completedResultScores.length)
      : null;

  const resultRows: PosttestStudentResultRow[] = selectedAssessment
    ? selectedAssessment.studentStatuses
        .map((status) => {
          const answers = status.answers ?? [];
          const score = getStudentScore(status);
          return {
            id: `${selectedAssessment.id}-${status.studentId}`,
            studentName: students.find((student) => student.id === status.studentId)?.name ?? '-',
            completed: status.completed,
            score,
            totalQuestions: selectedAssessment.questions.length,
            answers,
          };
        })
        .sort((first, second) => first.studentName.localeCompare(second.studentName))
    : [];

  const columns: TableColumn<PosttestStudentResultRow>[] = [
    { key: 'studentName', header: 'Siswa', render: (item) => item.studentName },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.completed ? 'green' : 'yellow'}>{item.completed ? 'Selesai' : 'Belum mengerjakan'}</Badge>
      ),
    },
    {
      key: 'score',
      header: 'Skor',
      render: (item) =>
        item.completed && typeof item.score === 'number' ? (
          <span className="font-semibold text-slate-900">
            {item.score}/{item.totalQuestions}
          </span>
        ) : (
          '-'
        ),
    },
    {
      key: 'percentage',
      header: 'Nilai',
      render: (item) =>
        item.completed && typeof item.score === 'number'
          ? `${Math.round((item.score / Math.max(item.totalQuestions, 1)) * 100)}`
          : '-',
    },
    {
      key: 'answers',
      header: 'Detail Jawaban',
      className: 'min-w-[320px]',
      render: (item) =>
        selectedAssessment && item.answers.length > 0 ? (
          <div className="space-y-2">
            {selectedAssessment.questions.map((question, index) => {
              const answer = item.answers.find((answerItem) => answerItem.questionId === question.id);
              return (
                <div key={`${item.id}-${question.id}`} className="flex flex-wrap items-center gap-2">
                  <span className="w-10 text-xs font-semibold text-slate-500">No {index + 1}</span>
                  <Badge variant={answer?.correct ? 'green' : 'red'}>{answer?.correct ? 'Benar' : 'Salah'}</Badge>
                  <span className="text-sm text-slate-600">{answer?.answer ?? '-'}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-slate-500">Belum ada detail jawaban tersimpan.</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hasil Posttest"
        description="Kurikulum melihat skor dan detail jawaban posttest yang dikumpulkan siswa."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <StatCard
          title="Paket Posttest"
          value={posttestAssessments.length}
          description="Jumlah paket posttest yang tersedia di sistem."
          icon={BookOpenCheck}
        />
        <StatCard
          title="Siswa Selesai"
          value={completedStatuses.length}
          description="Total pengumpulan posttest dari seluruh paket."
          icon={Users}
        />
        <StatCard
          title="Rata-rata Skor"
          value={averageScore === null ? '-' : `${averageScore}%`}
          description="Rata-rata skor dari posttest yang memiliki detail jawaban."
          icon={ClipboardCheck}
        />
      </div>

      <FilterBar>
        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-3">
          <span>Cari Posttest</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
            placeholder="Cari mapel, kelas, guru, atau tanggal"
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
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
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
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setClassFilter('all');
              setSubjectFilter('all');
              setSelectedAssessmentId('');
            }}
            className="w-full rounded-2xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Reset Filter
          </button>
        </div>
      </FilterBar>

      {filteredAssessments.length === 0 ? (
        <EmptyState
          title="Hasil posttest belum tersedia"
          description="Belum ada paket posttest yang cocok dengan filter saat ini."
          icon={FileSearch}
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Pilih Paket Posttest</h2>
                <p className="mt-1 text-sm text-slate-500">Pilih pertemuan untuk melihat hasil tiap siswa.</p>
              </div>
              <Badge variant="blue">{filteredAssessments.length} paket</Badge>
            </div>
            <div className="mt-6 max-h-[620px] space-y-3 overflow-y-auto pr-2">
              {filteredAssessments.map((assessment) => {
                const done = assessment.studentStatuses.filter((status) => status.completed).length;
                const total = assessment.studentStatuses.length;
                const teacherName = teachers.find((teacher) => teacher.id === assessment.teacherId)?.name ?? '-';
                const isSelected = selectedAssessment?.id === assessment.id;

                return (
                  <button
                    key={assessment.id}
                    type="button"
                    onClick={() => setSelectedAssessmentId(assessment.id)}
                    className={`w-full rounded-3xl border p-5 text-left transition ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50 shadow-soft'
                        : 'border-brand-100 bg-white hover:border-brand-300 hover:bg-brand-50/50'
                    }`}
                  >
                    <p className="text-base font-semibold text-slate-900">{getAssessmentLabel(assessment, classes, subjects)}</p>
                    <p className="mt-1 text-sm text-slate-500">{teacherName}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="green">{done}/{total} selesai</Badge>
                      <Badge variant="slate">{assessment.questions.length} soal</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-500">Paket Terpilih</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {selectedAssessment ? getAssessmentLabel(selectedAssessment, classes, subjects) : '-'}
              </h2>
              {selectedAssessment ? (
                <p className="mt-2 text-sm text-slate-600">
                  {teachers.find((teacher) => teacher.id === selectedAssessment.teacherId)?.name ?? '-'} -{' '}
                  {selectedAssessment.questions.length} soal
                </p>
              ) : null}
            </div>

            <DataTable
              data={resultRows}
              columns={columns}
              getRowKey={(item) => item.id}
              emptyTitle="Belum ada siswa pada paket ini"
              emptyDescription="Paket posttest terpilih belum memiliki status siswa."
              maxHeight="max-h-[680px]"
            />
          </section>
        </div>
      )}
    </div>
  );
}
