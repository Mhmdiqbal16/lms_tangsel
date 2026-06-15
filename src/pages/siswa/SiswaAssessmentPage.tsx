import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoAlert } from '@/components/ui/InfoAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import type { AssessmentRecord } from '@/types';
import { formatDateID, formatDayName } from '@/utils/date';
import { useStudentLearningSessions } from '@/pages/siswa/useStudentLearningSessions';
import { NotebookPen } from 'lucide-react';

const optionLabels = ['A', 'B', 'C', 'D'];

const statusVariantMap = {
  Selesai: 'green',
  Belum: 'yellow',
  Terkunci: 'red',
} as const;

interface SiswaAssessmentPageProps {
  type: 'pretest' | 'posttest';
}

function getAssessmentId(session: ReturnType<typeof useStudentLearningSessions>['sessions'][number], type: 'pretest' | 'posttest') {
  return type === 'pretest' ? session.eligibility.pretestAssessmentId : session.eligibility.posttestAssessmentId;
}

function getAssessmentDone(session: ReturnType<typeof useStudentLearningSessions>['sessions'][number], type: 'pretest' | 'posttest') {
  return type === 'pretest' ? session.eligibility.pretestDone : session.eligibility.posttestDone;
}

export function SiswaAssessmentPage({ type }: SiswaAssessmentPageProps) {
  const label = type === 'pretest' ? 'Pretest' : 'Posttest';
  const { student, sessions, assessments, completeAssessment } = useStudentLearningSessions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [pendingAssessmentId, setPendingAssessmentId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'info' | 'success' | 'warning'; text: string } | null>(null);

  const requestedKey =
    searchParams.get('scheduleId') && searchParams.get('date')
      ? `${searchParams.get('scheduleId')}-${searchParams.get('date')}`
      : '';
  const selectedSession = sessions.find((item) => item.key === requestedKey) ?? sessions[0];
  const assessmentId = selectedSession ? getAssessmentId(selectedSession, type) : undefined;
  const assessment = assessmentId ? assessments.find((item) => item.id === assessmentId) : undefined;
  const isDone = selectedSession ? getAssessmentDone(selectedSession, type) : false;
  const isLocked = selectedSession?.eligibility.locked ?? false;
  const needsJournalFirst = type === 'posttest' && !selectedSession?.journal;

  const handleSelectSession = (key: string) => {
    const session = sessions.find((item) => item.key === key);
    if (!session) {
      return;
    }

    setSearchParams({
      scheduleId: session.schedule.id,
      date: session.sessionDate,
    });
  };

  const handleAnswerChange = (targetAssessmentId: string, questionId: string, answer: string) => {
    setAnswers((current) => ({
      ...current,
      [targetAssessmentId]: {
        ...(current[targetAssessmentId] ?? {}),
        [questionId]: answer,
      },
    }));
  };

  const handleSubmit = async (targetAssessment: AssessmentRecord) => {
    if (!student) {
      return;
    }

    if (type === 'posttest' && !selectedSession?.journal) {
      setMessage({ tone: 'warning', text: 'Kirim jurnal terlebih dahulu sebelum mengerjakan posttest.' });
      return;
    }

    const currentAnswers = answers[targetAssessment.id] ?? {};
    if (targetAssessment.questions.some((question) => !currentAnswers[question.id])) {
      setMessage({ tone: 'warning', text: `Lengkapi seluruh jawaban ${label} sebelum mengumpulkan.` });
      return;
    }

    setPendingAssessmentId(targetAssessment.id);
    const result = await completeAssessment(targetAssessment.id, student.id);
    setPendingAssessmentId(null);
    setMessage({
      tone: result.success ? 'success' : 'warning',
      text: result.success ? `${label} berhasil dikumpulkan.` : result.message,
    });
  };

  if (!student || !selectedSession) {
    return (
      <div className="space-y-6">
        <PageHeader title={label} description={`Belum ada sesi belajar yang tersedia untuk ${label.toLowerCase()}.`} />
      </div>
    );
  }

  const currentAnswers = assessment ? answers[assessment.id] ?? {} : {};

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Kerjakan ${label}`}
        description={
          type === 'posttest'
            ? 'Posttest terbuka setelah jurnal untuk sesi ini dikirim.'
            : 'Pretest dikerjakan sebelum siswa mengisi jurnal pembelajaran.'
        }
      />

      {message ? <InfoAlert tone={message.tone} message={message.text} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pilih Sesi</h2>
              <p className="mt-1 text-sm text-slate-500">Pilih jadwal pelajaran yang akan dikerjakan.</p>
            </div>
            <Badge variant="blue">{sessions.length} sesi</Badge>
          </div>

          <div className="mt-6 max-h-[620px] space-y-4 overflow-y-auto pr-2">
            {sessions.map((item) => {
              const itemAssessmentId = getAssessmentId(item, type);
              const itemAssessment = itemAssessmentId ? assessments.find((assessmentItem) => assessmentItem.id === itemAssessmentId) : undefined;
              const done = getAssessmentDone(item, type);
              const requiresJournal = type === 'posttest' && !item.journal;
              const status = done ? 'Selesai' : item.eligibility.locked || requiresJournal ? 'Terkunci' : 'Belum';

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSelectSession(item.key)}
                  className={`w-full rounded-3xl border p-5 text-left transition ${
                    selectedSession.key === item.key
                      ? 'border-brand-600 bg-brand-50 shadow-soft'
                      : 'border-brand-100 bg-white hover:border-brand-300 hover:bg-brand-50/50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{item.subject?.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.teacher?.name} • {formatDayName(item.sessionDate)} • {formatDateID(item.sessionDate)}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {itemAssessment ? `${itemAssessment.questions.length} soal tersedia` : `Soal ${label.toLowerCase()} belum tersedia`}
                      </p>
                    </div>
                    <Badge variant={statusVariantMap[status]}>{status}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-500">{label}</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{selectedSession.subject?.name ?? '-'}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedSession.teacher?.name} • {formatDateID(selectedSession.sessionDate)}
              </p>
            </div>
            <Badge variant={isDone ? 'green' : needsJournalFirst ? 'red' : assessment ? 'yellow' : 'slate'}>
              {isDone ? 'Selesai' : needsJournalFirst ? 'Terkunci' : assessment ? 'Belum dikerjakan' : 'Belum tersedia'}
            </Badge>
          </div>

          <div className="mt-6">
            {isDone ? (
              <InfoAlert tone="success" message={`${label} untuk sesi ini sudah dikumpulkan.`} />
            ) : !assessment ? (
              <EmptyState
                title={`Soal ${label.toLowerCase()} belum tersedia`}
                description="Guru belum membuat paket soal untuk sesi pelajaran ini."
                icon={NotebookPen}
              />
            ) : needsJournalFirst ? (
              <InfoAlert tone="warning" message="Kirim jurnal terlebih dahulu sebelum mengerjakan posttest." />
            ) : assessment.status !== 'Aktif' ? (
              <InfoAlert tone="warning" message={`Paket ${label.toLowerCase()} tersedia, tetapi statusnya belum aktif.`} />
            ) : isLocked ? (
              <InfoAlert tone="warning" message="Sesi sudah terkunci karena melewati batas H+1." />
            ) : (
              <div className="space-y-4">
                {assessment.questions.map((question, questionIndex) => (
                  <div key={question.id} className="rounded-3xl border border-brand-100 bg-brand-50/40 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
                      Soal {questionIndex + 1}
                    </p>
                    <p className="mt-2 text-base font-semibold leading-7 text-slate-900">{question.question}</p>
                    <div className="mt-4 grid gap-2">
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={`${question.id}-${optionIndex}`}
                          className="flex cursor-pointer items-start gap-3 rounded-2xl border border-brand-100 bg-white p-3 text-sm text-slate-700 transition hover:border-brand-300 hover:bg-brand-50"
                        >
                          <input
                            type="radio"
                            name={`${assessment.id}-${question.id}`}
                            value={option}
                            checked={currentAnswers[question.id] === option}
                            onChange={(event) => handleAnswerChange(assessment.id, question.id, event.target.value)}
                            className="mt-1"
                          />
                          <span>
                            <span className="font-bold text-brand-700">{optionLabels[optionIndex]}.</span> {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleSubmit(assessment)}
                    disabled={pendingAssessmentId === assessment.id}
                    className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {pendingAssessmentId === assessment.id ? 'Mengirim...' : `Kumpulkan ${label}`}
                  </button>
                  <Link
                    to={`/siswa/jurnal?scheduleId=${selectedSession.schedule.id}&date=${selectedSession.sessionDate}`}
                    className="rounded-2xl border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                  >
                    Kembali ke Jurnal
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
