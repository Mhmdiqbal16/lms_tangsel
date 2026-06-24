import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { InfoAlert } from '@/components/ui/InfoAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDateID, formatDayName } from '@/utils/date';
import { useStudentLearningSessions } from '@/pages/siswa/useStudentLearningSessions';

const questionnaireItems = [
  { id: 'clarity', label: 'Kejelasan penyampaian materi' },
  { id: 'interaction', label: 'Interaksi dan kesempatan bertanya' },
  { id: 'discipline', label: 'Kedisiplinan waktu pembelajaran' },
  { id: 'support', label: 'Bimbingan saat siswa mengalami kesulitan' },
] as const;

type QuestionnaireRatingKey = (typeof questionnaireItems)[number]['id'];

interface QuestionnaireFormState {
  ratings: Record<QuestionnaireRatingKey, string>;
  note: string;
}

const initialQuestionnaireForm: QuestionnaireFormState = {
  ratings: {
    clarity: '',
    interaction: '',
    discipline: '',
    support: '',
  },
  note: '',
};

const statusVariantMap = {
  Selesai: 'green',
  Belum: 'yellow',
  Terkunci: 'red',
} as const;

export function SiswaKuisionerPage() {
  const { student, sessions, completeQuestionnaire } = useStudentLearningSessions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [forms, setForms] = useState<Record<string, QuestionnaireFormState>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'info' | 'success' | 'warning'; text: string } | null>(null);

  const requestedKey =
    searchParams.get('scheduleId') && searchParams.get('date')
      ? `${searchParams.get('scheduleId')}-${searchParams.get('date')}`
      : '';
  const selectedSession = sessions.find((item) => item.key === requestedKey) ?? sessions[0];
  const form = selectedSession ? forms[selectedSession.key] ?? initialQuestionnaireForm : initialQuestionnaireForm;
  const needsJournalFirst = Boolean(selectedSession && !selectedSession.journal);

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

  const updateForm = (updates: Partial<QuestionnaireFormState>) => {
    if (!selectedSession) {
      return;
    }

    setForms((current) => ({
      ...current,
      [selectedSession.key]: {
        ...form,
        ...updates,
      },
    }));
  };

  const handleRatingChange = (field: QuestionnaireRatingKey, value: string) => {
    updateForm({
      ratings: {
        ...form.ratings,
        [field]: value,
      },
    });
  };

  const handleSubmit = async () => {
    if (!student || !selectedSession) {
      return;
    }

    if (!selectedSession.journal) {
      setMessage({ tone: 'warning', text: 'Kirim jurnal terlebih dahulu sebelum mengisi kuisioner guru.' });
      return;
    }

    if (questionnaireItems.some((item) => !form.ratings[item.id])) {
      setMessage({ tone: 'warning', text: 'Lengkapi seluruh penilaian kuisioner guru sebelum mengirim.' });
      return;
    }

    setPendingKey(selectedSession.key);
    const result = await completeQuestionnaire({
      studentId: student.id,
      teacherId: selectedSession.schedule.teacherId,
      scheduleId: selectedSession.schedule.id,
      date: selectedSession.sessionDate,
    });
    setPendingKey(null);
    setMessage({ tone: result.success ? 'success' : 'warning', text: result.message });

    if (result.success) {
      setForms((current) => ({
        ...current,
        [selectedSession.key]: initialQuestionnaireForm,
      }));
    }
  };

  if (!student || !selectedSession) {
    return (
      <div className="space-y-6">
        <PageHeader title="Kuisioner Guru" description="Belum ada sesi belajar yang tersedia untuk kuisioner." />
        <Link
          to="/siswa/jurnal"
          className="inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Isi Jurnal
        </Link>
      </div>
    );
  }

  const journalReturnPath = `/siswa/jurnal?scheduleId=${selectedSession.schedule.id}&date=${selectedSession.sessionDate}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kuisioner Guru"
        description="Kuisioner terbuka setelah jurnal untuk sesi ini dikirim."
      />
      <Link
        to={journalReturnPath}
        className="inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Isi Jurnal
      </Link>

      {message ? <InfoAlert tone={message.tone} message={message.text} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pilih Sesi</h2>
              <p className="mt-1 text-sm text-slate-500">Pilih jadwal pelajaran yang akan dinilai.</p>
            </div>
            <Badge variant="blue">{sessions.length} sesi</Badge>
          </div>

          <div className="mt-6 max-h-[620px] space-y-4 overflow-y-auto pr-2">
            {sessions.map((item) => {
              const status = item.eligibility.questionnaireDone
                ? 'Selesai'
                : item.eligibility.locked || !item.journal
                  ? 'Terkunci'
                  : 'Belum';

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
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-500">Kuisioner Guru</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{selectedSession.subject?.name ?? '-'}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedSession.teacher?.name} • {formatDateID(selectedSession.sessionDate)}
              </p>
            </div>
            <Badge
              variant={
                selectedSession.eligibility.questionnaireDone
                  ? 'green'
                  : selectedSession.eligibility.locked || needsJournalFirst
                    ? 'red'
                    : 'yellow'
              }
            >
              {selectedSession.eligibility.questionnaireDone
                ? 'Sudah diisi'
                : selectedSession.eligibility.locked || needsJournalFirst
                  ? 'Terkunci'
                  : 'Belum diisi'}
            </Badge>
          </div>

          {selectedSession.eligibility.questionnaireDone ? (
            <div className="mt-6">
              <InfoAlert tone="success" message="Kuisioner guru untuk sesi ini sudah dikirim." />
            </div>
          ) : selectedSession.eligibility.locked ? (
            <div className="mt-6">
              <InfoAlert tone="warning" message="Kuisioner tidak dapat diisi karena sesi sudah terkunci melewati batas H+1." />
            </div>
          ) : needsJournalFirst ? (
            <div className="mt-6">
              <InfoAlert tone="warning" message="Kirim jurnal terlebih dahulu sebelum mengisi kuisioner guru." />
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                {questionnaireItems.map((item) => (
                  <label key={item.id} className="space-y-2 text-sm font-medium text-slate-700">
                    <span>{item.label}</span>
                    <select
                      value={form.ratings[item.id]}
                      onChange={(event) => handleRatingChange(item.id, event.target.value)}
                      className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                    >
                      <option value="">Pilih nilai</option>
                      <option value="5">5 - Sangat baik</option>
                      <option value="4">4 - Baik</option>
                      <option value="3">3 - Cukup</option>
                      <option value="2">2 - Kurang</option>
                      <option value="1">1 - Perlu perbaikan</option>
                    </select>
                  </label>
                ))}
              </div>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Catatan untuk guru (opsional)</span>
                <textarea
                  value={form.note}
                  onChange={(event) => updateForm({ note: event.target.value })}
                  rows={5}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                  placeholder="Tuliskan masukan singkat tentang pembelajaran hari ini."
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={pendingKey === selectedSession.key}
                  className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {pendingKey === selectedSession.key ? 'Mengirim...' : 'Kirim Kuisioner'}
                </button>
                <Link
                  to={journalReturnPath}
                  className="rounded-2xl border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                >
                  Kembali ke Isi Jurnal
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
