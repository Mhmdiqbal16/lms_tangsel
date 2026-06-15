import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { InfoAlert } from '@/components/ui/InfoAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDateID, formatDayName } from '@/utils/date';
import { useStudentLearningSessions } from '@/pages/siswa/useStudentLearningSessions';

const statusVariantMap = {
  Selesai: 'green',
  Belum: 'yellow',
  Terkunci: 'red',
} as const;

interface JournalFormState {
  materialStudied: string;
  summary: string;
  tasks: string;
  learningObstacles: string;
  attachmentName: string;
}

function getSessionUrl(path: string, scheduleId: string, date: string) {
  return `${path}?scheduleId=${encodeURIComponent(scheduleId)}&date=${encodeURIComponent(date)}`;
}

export function SiswaJurnalPage() {
  const { student, sessions, assessments, addStudentJournal } = useStudentLearningSessions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'info' | 'success' | 'warning'; text: string } | null>(null);
  const [form, setForm] = useState<JournalFormState>({
    materialStudied: '',
    summary: '',
    tasks: '',
    learningObstacles: '',
    attachmentName: '',
  });

  const requestedKey =
    searchParams.get('scheduleId') && searchParams.get('date')
      ? `${searchParams.get('scheduleId')}-${searchParams.get('date')}`
      : '';
  const selectedSession = sessions.find((item) => item.key === requestedKey) ?? sessions[0];

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    setForm({
      materialStudied: selectedSession.material?.title ?? '',
      summary: '',
      tasks: '',
      learningObstacles: '',
      attachmentName: '',
    });
  }, [selectedSession?.key, selectedSession?.material?.title]);

  if (!student || !selectedSession) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Isi Jurnal"
          description="Belum ada sesi belajar yang siap ditampilkan untuk pengisian jurnal."
        />
      </div>
    );
  }

  const isFormDisabled = !selectedSession.eligibility.canSubmit || isSaving;
  const pretestAssessment = selectedSession.eligibility.pretestAssessmentId
    ? assessments.find((assessment) => assessment.id === selectedSession.eligibility.pretestAssessmentId)
    : undefined;
  const posttestAssessment = selectedSession.eligibility.posttestAssessmentId
    ? assessments.find((assessment) => assessment.id === selectedSession.eligibility.posttestAssessmentId)
    : undefined;
  const pretestUrl = getSessionUrl('/siswa/pretest', selectedSession.schedule.id, selectedSession.sessionDate);
  const posttestUrl = getSessionUrl('/siswa/posttest', selectedSession.schedule.id, selectedSession.sessionDate);
  const questionnaireUrl = getSessionUrl('/siswa/kuisioner', selectedSession.schedule.id, selectedSession.sessionDate);

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

  const handleChange = (field: keyof JournalFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleChange('attachmentName', file?.name ?? '');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSession.eligibility.canSubmit) {
      setMessage({ tone: 'warning', text: selectedSession.eligibility.message });
      return;
    }

    if (!form.materialStudied || !form.summary || !form.tasks || !form.learningObstacles) {
      setMessage({ tone: 'warning', text: 'Lengkapi seluruh bagian form jurnal sebelum menyimpan.' });
      return;
    }

    setIsSaving(true);
    const result = await addStudentJournal({
      studentId: student.id,
      scheduleId: selectedSession.schedule.id,
      date: selectedSession.sessionDate,
      materialStudied: form.materialStudied,
      summary: form.summary,
      tasks: form.tasks,
      learningObstacles: form.learningObstacles,
      attachmentName: form.attachmentName || 'lampiran-dummy.pdf',
    });
    setIsSaving(false);

    setMessage({ tone: result.success ? 'success' : 'warning', text: result.message });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Isi Jurnal"
        description="Selesaikan pretest, kirim jurnal, lalu lanjutkan posttest dan kuisioner di halaman masing-masing."
      />

      {message ? <InfoAlert tone={message.tone} message={message.text} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Daftar Pelajaran Aktif & H+1</h2>
              <p className="mt-1 text-sm text-slate-500">
                Pilih sesi pelajaran yang akan dilengkapi syarat dan jurnalnya.
              </p>
            </div>
            <Badge variant="blue">Batas H+1 aktif</Badge>
          </div>

          <div className="mt-6 max-h-[620px] space-y-4 overflow-y-auto pr-2">
            {sessions.map((item) => (
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
                      {item.schedule.startTime} - {item.schedule.endTime}
                    </p>
                  </div>
                  <Badge variant={statusVariantMap[item.eligibility.status]}>{item.eligibility.status}</Badge>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{item.eligibility.message}</p>
              </button>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Status Syarat Pengisian</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Alur dibuat bertahap agar siswa mengerjakan dari pretest, jurnal, lalu posttest dan kuisioner.
                </p>
              </div>
              <Badge variant={statusVariantMap[selectedSession.eligibility.status]}>{selectedSession.eligibility.status}</Badge>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-brand-100 bg-brand-50/50 p-4">
                <p className="text-sm font-medium text-slate-500">Pretest</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {selectedSession.eligibility.pretestDone ? 'Selesai' : 'Belum'}
                </p>
                {!selectedSession.eligibility.pretestDone ? (
                  <Link
                    to={pretestUrl}
                    className="mt-4 inline-flex rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    {pretestAssessment ? 'Kerjakan Pretest' : 'Cek Pretest'}
                  </Link>
                ) : null}
              </div>

              <div className="rounded-3xl border border-brand-100 bg-brand-50/50 p-4">
                <p className="text-sm font-medium text-slate-500">Posttest</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {selectedSession.eligibility.posttestDone ? 'Selesai' : 'Belum'}
                </p>
                {!selectedSession.eligibility.posttestDone && selectedSession.journal ? (
                  <Link
                    to={posttestUrl}
                    className="mt-4 inline-flex rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    {posttestAssessment ? 'Kerjakan Posttest' : 'Cek Posttest'}
                  </Link>
                ) : null}
                {!selectedSession.eligibility.posttestDone && !selectedSession.journal ? (
                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    Kirim jurnal terlebih dahulu untuk membuka posttest.
                  </p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-brand-100 bg-brand-50/50 p-4">
                <p className="text-sm font-medium text-slate-500">Kuisioner Guru</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {selectedSession.eligibility.questionnaireDone ? 'Sudah diisi' : 'Belum'}
                </p>
                {!selectedSession.eligibility.questionnaireDone && selectedSession.journal ? (
                  <Link
                    to={questionnaireUrl}
                    className="mt-4 inline-flex rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    Isi Kuisioner
                  </Link>
                ) : null}
                {!selectedSession.eligibility.questionnaireDone && !selectedSession.journal ? (
                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    Kirim jurnal terlebih dahulu untuk membuka kuisioner.
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Form Jurnal</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Form aktif setelah pretest selesai.
                </p>
              </div>
              <Badge variant="blue">{formatDateID(selectedSession.sessionDate)}</Badge>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Tanggal</span>
                  <input
                    value={formatDateID(selectedSession.sessionDate)}
                    readOnly
                    className="w-full rounded-2xl border border-brand-100 bg-slate-50 px-4 py-3 outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Mata Pelajaran</span>
                  <input
                    value={selectedSession.subject?.name ?? '-'}
                    readOnly
                    className="w-full rounded-2xl border border-brand-100 bg-slate-50 px-4 py-3 outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Guru</span>
                  <input
                    value={selectedSession.teacher?.name ?? '-'}
                    readOnly
                    className="w-full rounded-2xl border border-brand-100 bg-slate-50 px-4 py-3 outline-none"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Materi yang dipelajari</span>
                <input
                  value={form.materialStudied}
                  onChange={(event) => handleChange('materialStudied', event.target.value)}
                  disabled={isFormDisabled}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-slate-50"
                  placeholder="Contoh: Normalisasi 1NF sampai 3NF"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Rangkuman</span>
                <textarea
                  value={form.summary}
                  onChange={(event) => handleChange('summary', event.target.value)}
                  disabled={isFormDisabled}
                  rows={4}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-slate-50"
                  placeholder="Tuliskan inti materi yang dipahami dari pembelajaran hari ini."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Tugas</span>
                  <textarea
                    value={form.tasks}
                    onChange={(event) => handleChange('tasks', event.target.value)}
                    disabled={isFormDisabled}
                    rows={4}
                    className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-slate-50"
                    placeholder="Tuliskan tugas atau latihan yang diberikan guru."
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Kendala belajar</span>
                  <textarea
                    value={form.learningObstacles}
                    onChange={(event) => handleChange('learningObstacles', event.target.value)}
                    disabled={isFormDisabled}
                    rows={4}
                    className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-slate-50"
                    placeholder="Tuliskan kendala atau catatan refleksi belajar."
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Upload lampiran (dummy)</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  disabled={isFormDisabled}
                  className="w-full rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:font-semibold file:text-white disabled:cursor-not-allowed disabled:bg-slate-50"
                />
                {form.attachmentName ? <p className="text-sm text-slate-500">Lampiran terpilih: {form.attachmentName}</p> : null}
              </label>

              {selectedSession.journal ? (
                <InfoAlert tone="success" message="Jurnal untuk sesi ini sudah tersimpan, sehingga form dikunci untuk mencegah duplikasi." />
              ) : null}

              <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-sm leading-6 text-slate-600">
                Jurnal hanya dapat diisi pada hari pembelajaran berlangsung atau maksimal H+1. Jika melewati H+1,
                status sesi akan berubah menjadi terkunci.
              </div>

              <button
                type="submit"
                disabled={!selectedSession.eligibility.canSubmit || isSaving}
                className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Jurnal'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
