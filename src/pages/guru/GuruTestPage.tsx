import { FormEvent, useState } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InfoAlert } from '@/components/ui/InfoAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { academicDateReference } from '@/data/mockData';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { useActionNotifier } from '@/useActionNotifier';
import { formatDateID, formatDayName } from '@/utils/date';

const MAX_QUESTIONS = 10;
const optionLabels = ['A', 'B', 'C', 'D'];

interface QuestionDraft {
  question: string;
  options: string[];
  answerIndex: number;
}

type QuestionSection = 'pretest' | 'posttest';
type TestConfirmation =
  | { type: 'remove-question'; section: QuestionSection; index: number }
  | { type: 'copy-pretest' };

interface GuruAssessmentSectionProps {
  showHeader?: boolean;
}

function createEmptyQuestion(): QuestionDraft {
  return {
    question: '',
    options: ['', '', '', ''],
    answerIndex: 0,
  };
}

function getInitialQuestions() {
  return [createEmptyQuestion()];
}

export function GuruAssessmentSection({ showHeader = true }: GuruAssessmentSectionProps) {
  const { session } = useAuth();
  const { teachers, schedules, classes, subjects, assessments, addAssessmentBundle } = useAppData();
  const teacher = teachers.find((item) => item.id === session?.referenceId);
  const teacherSchedules = schedules.filter((item) => item.teacherId === teacher?.id);
  const [scheduleId, setScheduleId] = useState(teacherSchedules[0]?.id ?? '');
  const [meeting, setMeeting] = useState(9);
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [pretestQuestions, setPretestQuestions] = useState<QuestionDraft[]>(() => getInitialQuestions());
  const [posttestQuestions, setPosttestQuestions] = useState<QuestionDraft[]>(() => getInitialQuestions());
  const [activeSection, setActiveSection] = useState<QuestionSection>('pretest');
  const [activeQuestionIndexes, setActiveQuestionIndexes] = useState<Record<QuestionSection, number>>({
    pretest: 0,
    posttest: 0,
  });
  const [testConfirmation, setTestConfirmation] = useState<TestConfirmation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'info' | 'success' | 'warning'; text: string } | null>(null);
  useActionNotifier(message);

  if (!teacher) {
    return null;
  }

  const selectedSchedule = teacherSchedules.find((item) => item.id === scheduleId) ?? teacherSchedules[0];
  const teacherAssessmentGroups = new Map<
    string,
    {
      key: string;
      date: string;
      className: string;
      subject: string;
      meeting: number;
      status: string;
      pretestDone: number;
      pretestTotal: number;
      pretestQuestionCount: number;
      posttestDone: number;
      posttestTotal: number;
      posttestQuestionCount: number;
      previewQuestions: string[];
    }
  >();

  assessments
    .filter((item) => item.teacherId === teacher.id)
    .forEach((assessment) => {
      const groupKey = `${assessment.scheduleId}-${assessment.date}-${assessment.meeting}`;
      const schedule = schedules.find((item) => item.id === assessment.scheduleId);
      const existing = teacherAssessmentGroups.get(groupKey) ?? {
        key: groupKey,
        date: assessment.date,
        className: classes.find((item) => item.id === schedule?.classId)?.name ?? '-',
        subject: subjects.find((item) => item.id === assessment.subjectId)?.name ?? '-',
        meeting: assessment.meeting,
        status: assessment.status,
        pretestDone: 0,
        pretestTotal: 0,
        pretestQuestionCount: 0,
        posttestDone: 0,
        posttestTotal: 0,
        posttestQuestionCount: 0,
        previewQuestions: [],
      };

      if (assessment.type === 'pretest') {
        existing.pretestDone = assessment.studentStatuses.filter((item) => item.completed).length;
        existing.pretestTotal = assessment.studentStatuses.length;
        existing.pretestQuestionCount = assessment.questions.length;
      } else {
        existing.posttestDone = assessment.studentStatuses.filter((item) => item.completed).length;
        existing.posttestTotal = assessment.studentStatuses.length;
        existing.posttestQuestionCount = assessment.questions.length;
      }

      const typeLabel = assessment.type === 'pretest' ? 'Pretest' : 'Posttest';
      existing.previewQuestions = Array.from(
        new Set([
          ...existing.previewQuestions,
          ...assessment.questions.slice(0, 2).map((question) => `${typeLabel}: ${question.question}`),
        ]),
      ).slice(0, 4);

      teacherAssessmentGroups.set(groupKey, existing);
    });

  const groupList = Array.from(teacherAssessmentGroups.values()).sort((first, second) => second.date.localeCompare(first.date));

  const getQuestionSetter = (section: QuestionSection) =>
    section === 'pretest' ? setPretestQuestions : setPosttestQuestions;

  const getQuestions = (section: QuestionSection) => (section === 'pretest' ? pretestQuestions : posttestQuestions);

  const setActiveQuestionIndex = (section: QuestionSection, index: number) => {
    const questions = getQuestions(section);
    setActiveQuestionIndexes((current) => ({
      ...current,
      [section]: Math.max(0, Math.min(index, questions.length - 1)),
    }));
  };

  const updateQuestion = (section: QuestionSection, index: number, updates: Partial<QuestionDraft>) => {
    getQuestionSetter(section)((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...updates } : item)),
    );
  };

  const updateOption = (section: QuestionSection, questionIndex: number, optionIndex: number, value: string) => {
    getQuestionSetter(section)((current) =>
      current.map((item, itemIndex) =>
        itemIndex !== questionIndex
          ? item
          : {
              ...item,
              options: item.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex ? value : option,
              ),
            },
      ),
    );
  };

  const addQuestion = (section: QuestionSection) => {
    const questions = section === 'pretest' ? pretestQuestions : posttestQuestions;

    if (questions.length >= MAX_QUESTIONS) {
      setMessage({ tone: 'warning', text: `Maksimal ${MAX_QUESTIONS} soal untuk setiap pretest atau posttest.` });
      return;
    }

    getQuestionSetter(section)((current) => [...current, createEmptyQuestion()]);
    setActiveSection(section);
    setActiveQuestionIndexes((current) => ({ ...current, [section]: questions.length }));
  };

  const requestRemoveQuestion = (section: QuestionSection, index: number) => {
    const questions = getQuestions(section);

    if (questions.length === 1) {
      return;
    }

    setTestConfirmation({ type: 'remove-question', section, index });
  };

  const executeRemoveQuestion = (section: QuestionSection, index: number) => {
    const questions = getQuestions(section);

    getQuestionSetter(section)((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setActiveQuestionIndexes((current) => {
      let nextIndex = current[section];
      if (index < nextIndex) {
        nextIndex -= 1;
      }
      if (index === nextIndex) {
        nextIndex = Math.min(nextIndex, questions.length - 2);
      }
      return { ...current, [section]: Math.max(0, nextIndex) };
    });
  };

  const requestCopyPretestToPosttest = () => {
    setTestConfirmation({ type: 'copy-pretest' });
  };

  const executeCopyPretestToPosttest = () => {
    setPosttestQuestions(pretestQuestions.map((question) => ({ ...question, options: [...question.options] })));
    setActiveSection('posttest');
    setActiveQuestionIndexes((current) => ({ ...current, posttest: 0 }));
    setMessage({ tone: 'info', text: 'Soal pretest disalin ke posttest. Silakan sesuaikan jika diperlukan.' });
  };

  const handleConfirmTestAction = () => {
    if (!testConfirmation) {
      return;
    }

    if (testConfirmation.type === 'remove-question') {
      executeRemoveQuestion(testConfirmation.section, testConfirmation.index);
    } else {
      executeCopyPretestToPosttest();
    }

    setTestConfirmation(null);
  };

  const toQuestionPayload = (questions: QuestionDraft[]) =>
    questions.map((question) => ({
      question: question.question,
      options: question.options,
      answer: question.options[question.answerIndex] ?? '',
    }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSchedule) {
      setMessage({ tone: 'warning', text: 'Pilih jadwal guru terlebih dahulu.' });
      return;
    }

    setIsSaving(true);
    const result = await addAssessmentBundle({
      teacherId: teacher.id,
      scheduleId: selectedSchedule.id,
      date: academicDateReference,
      classId: selectedSchedule.classId,
      subjectId: selectedSchedule.subjectId,
      meeting,
      status,
      pretestQuestions: toQuestionPayload(pretestQuestions),
      posttestQuestions: toQuestionPayload(posttestQuestions),
    });
    setIsSaving(false);

    setMessage({ tone: result.success ? 'success' : 'warning', text: result.message });

    if (result.success) {
      setPretestQuestions(getInitialQuestions());
      setPosttestQuestions(getInitialQuestions());
      setActiveSection('pretest');
      setActiveQuestionIndexes({ pretest: 0, posttest: 0 });
    }
  };

  const renderQuestionEditor = (section: QuestionSection, title: string, questions: QuestionDraft[]) => {
    const activeIndex = Math.min(activeQuestionIndexes[section], questions.length - 1);
    const question = questions[activeIndex];

    return (
      <div className="space-y-4 rounded-3xl border border-brand-100 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {questions.length}/{MAX_QUESTIONS} soal pilihan ganda
            </p>
          </div>
          <button
            type="button"
            onClick={() => addQuestion(section)}
            disabled={questions.length >= MAX_QUESTIONS}
            className="inline-flex items-center gap-2 rounded-2xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            <Plus className="h-4 w-4" />
            Tambah Soal
          </button>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-brand-100 bg-brand-50/50 p-3">
          {questions.map((_, questionIndex) => (
            <button
              key={`${section}-nav-${questionIndex}`}
              type="button"
              onClick={() => setActiveQuestionIndex(section, questionIndex)}
              className={`h-10 w-10 rounded-xl text-sm font-bold transition ${
                activeIndex === questionIndex
                  ? 'bg-brand-600 text-white shadow-soft'
                  : 'bg-white text-slate-600 ring-1 ring-brand-100 hover:bg-brand-50'
              }`}
            >
              {questionIndex + 1}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-brand-100 bg-brand-50/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="blue">Soal {activeIndex + 1}</Badge>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveQuestionIndex(section, activeIndex - 1)}
                disabled={activeIndex === 0}
                className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setActiveQuestionIndex(section, activeIndex + 1)}
                disabled={activeIndex === questions.length - 1}
                className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Berikutnya
              </button>
              <button
                type="button"
                onClick={() => requestRemoveQuestion(section, activeIndex)}
                disabled={questions.length === 1}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus
              </button>
            </div>
          </div>

          <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
            <span>Pertanyaan</span>
            <textarea
              value={question.question}
              onChange={(event) => updateQuestion(section, activeIndex, { question: event.target.value })}
              rows={3}
              className="w-full rounded-2xl border border-brand-100 bg-white px-4 py-3 outline-none"
              placeholder="Tulis pertanyaan pilihan ganda."
            />
          </label>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {question.options.map((option, optionIndex) => (
              <label key={`${section}-${activeIndex}-${optionIndex}`} className="space-y-2 text-sm font-medium text-slate-700">
                <span>Opsi {optionLabels[optionIndex]}</span>
                <input
                  value={option}
                  onChange={(event) => updateOption(section, activeIndex, optionIndex, event.target.value)}
                  className="w-full rounded-2xl border border-brand-100 bg-white px-4 py-3 outline-none"
                  placeholder={`Jawaban ${optionLabels[optionIndex]}`}
                />
              </label>
            ))}
          </div>

          <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
            <span>Kunci Jawaban</span>
            <select
              value={question.answerIndex}
              onChange={(event) => updateQuestion(section, activeIndex, { answerIndex: Number(event.target.value) })}
              className="w-full rounded-2xl border border-brand-100 bg-white px-4 py-3 outline-none"
            >
              {optionLabels.map((label, optionIndex) => (
                <option key={label} value={optionIndex}>
                  Opsi {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {showHeader ? (
        <PageHeader
          title="Pretest & Posttest"
          description="Guru membuat soal pilihan ganda untuk pretest dan posttest. Setiap paket maksimal 10 soal."
        />
      ) : null}

      {message ? <InfoAlert tone={message.tone} message={message.text} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-bold text-slate-900">Buat Paket Assessment</h2>
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Jadwal / Kelas / Mapel</span>
              <select
                value={scheduleId}
                onChange={(event) => setScheduleId(event.target.value)}
                className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
              >
                {teacherSchedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {formatDayName(schedule.day)} - {classes.find((item) => item.id === schedule.classId)?.name} -{' '}
                    {subjects.find((item) => item.id === schedule.subjectId)?.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Pertemuan</span>
                <input
                  type="number"
                  min={1}
                  value={meeting}
                  onChange={(event) => setMeeting(Number(event.target.value))}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as 'Aktif' | 'Nonaktif')}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </label>
            </div>

            {selectedSchedule ? (
              <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                <p className="text-sm font-semibold text-brand-700">Ringkasan paket</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {classes.find((item) => item.id === selectedSchedule.classId)?.name} -{' '}
                  {subjects.find((item) => item.id === selectedSchedule.subjectId)?.name} -{' '}
                  {formatDateID(academicDateReference)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Paket yang dibuat langsung menghasilkan pretest dan posttest untuk pertemuan yang sama.
                </p>
              </div>
            ) : null}

            <div className="space-y-4 rounded-3xl border border-brand-100 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex rounded-2xl border border-brand-100 bg-white p-1">
                  {[
                    { id: 'pretest' as const, label: 'Pretest', count: pretestQuestions.length },
                    { id: 'posttest' as const, label: 'Posttest', count: posttestQuestions.length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSection(tab.id)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        activeSection === tab.id ? 'bg-brand-600 text-white shadow-soft' : 'text-slate-600 hover:bg-brand-50'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={requestCopyPretestToPosttest}
                  className="inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                >
                  <Copy className="h-4 w-4" />
                  Salin Pretest ke Posttest
                </button>
              </div>

              {activeSection === 'pretest'
                ? renderQuestionEditor('pretest', 'Soal Pretest', pretestQuestions)
                : renderQuestionEditor('posttest', 'Soal Posttest', posttestQuestions)}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? 'Menyimpan...' : 'Buat Paket Test'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Ringkasan Paket</h2>
              <p className="mt-1 text-sm text-slate-500">Status ketersediaan pretest, posttest, dan progres pengerjaan siswa.</p>
            </div>
            <Badge variant="blue">{groupList.length} paket</Badge>
          </div>

          <div className="mt-6 max-h-[720px] space-y-4 overflow-y-auto pr-2">
            {groupList.map((group) => (
              <div key={group.key} className="rounded-3xl border border-brand-100 bg-slate-50/80 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{group.subject}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {group.className} - Pertemuan {group.meeting} - {formatDateID(group.date)}
                    </p>
                  </div>
                  <Badge variant={group.status === 'Aktif' ? 'green' : 'slate'}>{group.status}</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-medium text-slate-500">Pretest tersedia</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {group.pretestQuestionCount} soal - {group.pretestDone}/{group.pretestTotal} siswa selesai
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-medium text-slate-500">Posttest tersedia</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {group.posttestQuestionCount} soal - {group.posttestDone}/{group.posttestTotal} siswa selesai
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-white p-4">
                  <p className="text-sm font-medium text-slate-500">Pratinjau soal tersimpan</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                    {group.previewQuestions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(testConfirmation)}
        title={testConfirmation?.type === 'copy-pretest' ? 'Salin pretest ke posttest?' : 'Hapus soal?'}
        description={
          testConfirmation?.type === 'copy-pretest'
            ? 'Semua soal posttest saat ini akan diganti dengan salinan soal pretest.'
            : testConfirmation
              ? `Soal ${testConfirmation.index + 1} pada ${testConfirmation.section === 'pretest' ? 'Pretest' : 'Posttest'} akan dihapus dari draft.`
              : 'Aksi ini akan mengubah draft soal.'
        }
        tone={testConfirmation?.type === 'copy-pretest' ? 'warning' : 'danger'}
        confirmLabel={testConfirmation?.type === 'copy-pretest' ? 'Salin' : 'Hapus'}
        onConfirm={handleConfirmTestAction}
        onCancel={() => setTestConfirmation(null)}
      />
    </div>
  );
}

export function GuruTestPage() {
  return <GuruAssessmentSection />;
}
