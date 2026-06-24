import { useState } from 'react';
import { BarChart3, BookOpenCheck, FileSearch, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import type { AssessmentRecord, AssessmentType } from '@/types';
import { formatDateID } from '@/utils/date';

interface AssessmentStudentResultRow {
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
  const typeLabel = assessment.type === 'pretest' ? 'Pretest' : 'Posttest';
  return `${typeLabel} - ${subjectName} - ${className} - Pertemuan ${assessment.meeting} - ${formatDateID(assessment.date)}`;
}

export function GuruHasilAssessmentPage() {
  const { session } = useAuth();
  const { assessments, students, classes, subjects } = useAppData();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<AssessmentType | 'all'>('all');
  const [classFilter, setClassFilter] = useState('all');

  const teacherAssessments = assessments
    .filter((assessment) => assessment.teacherId === session?.referenceId)
    .slice()
    .sort((first, second) => second.date.localeCompare(first.date) || second.meeting - first.meeting);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredAssessments = teacherAssessments
    .filter((assessment) => (typeFilter === 'all' ? true : assessment.type === typeFilter))
    .filter((assessment) => (classFilter === 'all' ? true : assessment.classId === classFilter))
    .filter((assessment) => {
      if (!normalizedSearch) {
        return true;
      }

      return getAssessmentLabel(assessment, classes, subjects).toLowerCase().includes(normalizedSearch);
    });

  const selectedAssessment =
    filteredAssessments.find((assessment) => assessment.id === selectedAssessmentId) ?? filteredAssessments[0];
  const completedStatuses = teacherAssessments.flatMap((assessment) =>
    assessment.studentStatuses.filter((status) => status.completed),
  );
  const completedResultScores = teacherAssessments.flatMap((assessment) =>
    assessment.studentStatuses
      .filter((status) => status.completed && (typeof status.score === 'number' || (status.answers?.length ?? 0) > 0))
      .map((status) => {
        const score =
          typeof status.score === 'number'
            ? status.score
            : (status.answers ?? []).filter((answer) => answer.correct).length;
        return Math.round((score / Math.max(assessment.questions.length, 1)) * 100);
      }),
  );
  const averageScore =
    completedResultScores.length > 0
      ? Math.round(completedResultScores.reduce((total, score) => total + score, 0) / completedResultScores.length)
      : null;

  const resultRows: AssessmentStudentResultRow[] = selectedAssessment
    ? selectedAssessment.studentStatuses
        .map((status) => {
          const answers = status.answers ?? [];
          return {
            id: `${selectedAssessment.id}-${status.studentId}`,
            studentName: students.find((student) => student.id === status.studentId)?.name ?? '-',
            completed: status.completed,
            score:
              typeof status.score === 'number'
                ? status.score
                : answers.length > 0
                  ? answers.filter((answer) => answer.correct).length
                  : undefined,
            totalQuestions: selectedAssessment.questions.length,
            answers,
          };
        })
        .sort((first, second) => first.studentName.localeCompare(second.studentName))
    : [];

  const teacherClassIds = Array.from(new Set(teacherAssessments.map((assessment) => assessment.classId)));
  const columns: TableColumn<AssessmentStudentResultRow>[] = [
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
        title="Hasil Pretest & Posttest"
        description="Guru melihat hasil pengerjaan pretest dan posttest dari siswa pada kelas yang diajar."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <StatCard
          title="Paket Test"
          value={teacherAssessments.length}
          description="Jumlah paket pretest dan posttest yang dibuat guru."
          icon={BookOpenCheck}
        />
        <StatCard
          title="Siswa Selesai"
          value={completedStatuses.length}
          description="Total pengerjaan test yang sudah dikumpulkan siswa."
          icon={Users}
        />
        <StatCard
          title="Rata-rata Nilai"
          value={averageScore === null ? '-' : `${averageScore}%`}
          description="Rata-rata nilai dari test yang memiliki detail jawaban."
          icon={BarChart3}
        />
      </div>

      <FilterBar>
        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
          <span>Cari Test</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
            placeholder="Cari mapel, kelas, tanggal, atau pertemuan"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Jenis Test</span>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as AssessmentType | 'all')}
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
          >
            <option value="all">Semua jenis</option>
            <option value="pretest">Pretest</option>
            <option value="posttest">Posttest</option>
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
            {teacherClassIds.map((classId) => (
              <option key={classId} value={classId}>
                {classes.find((classItem) => classItem.id === classId)?.name ?? '-'}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('all');
              setClassFilter('all');
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
          title="Hasil test belum tersedia"
          description="Belum ada paket pretest atau posttest yang cocok dengan filter saat ini."
          icon={FileSearch}
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Pilih Paket Test</h2>
                <p className="mt-1 text-sm text-slate-500">Pilih paket untuk melihat hasil tiap siswa.</p>
              </div>
              <Badge variant="blue">{filteredAssessments.length} paket</Badge>
            </div>
            <div className="mt-6 max-h-[620px] space-y-3 overflow-y-auto pr-2">
              {filteredAssessments.map((assessment) => {
                const done = assessment.studentStatuses.filter((status) => status.completed).length;
                const total = assessment.studentStatuses.length;
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
                    <p className="text-base font-semibold text-slate-900">
                      {getAssessmentLabel(assessment, classes, subjects)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={assessment.type === 'pretest' ? 'blue' : 'green'}>
                        {assessment.type === 'pretest' ? 'Pretest' : 'Posttest'}
                      </Badge>
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
                  {selectedAssessment.questions.length} soal - {selectedAssessment.studentStatuses.length} siswa
                </p>
              ) : null}
            </div>

            <DataTable
              data={resultRows}
              columns={columns}
              getRowKey={(item) => item.id}
              emptyTitle="Belum ada siswa pada paket ini"
              emptyDescription="Paket test terpilih belum memiliki status siswa."
              maxHeight="max-h-[680px]"
            />
          </section>
        </div>
      )}
    </div>
  );
}
