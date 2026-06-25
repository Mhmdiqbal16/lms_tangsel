import { FormEvent, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { InfoAlert } from '@/components/ui/InfoAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, TableColumn } from '@/components/tables/DataTable';
import { academicDateReference } from '@/data/mockData';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { GuruAssessmentSection } from '@/pages/guru/GuruTestPage';
import { useActionNotifier } from '@/useActionNotifier';
import { formatDateID, formatDayName } from '@/utils/date';

interface MaterialRow {
  id: string;
  date: string;
  className: string;
  subject: string;
  meeting: number;
  title: string;
  status: string;
}

export function GuruMateriPage() {
  const { session } = useAuth();
  const { teachers, schedules, classes, subjects, learningMaterials, addLearningMaterial } = useAppData();
  const teacher = teachers.find((item) => item.id === session?.referenceId);
  const teacherSchedules = schedules.filter((item) => item.teacherId === teacher?.id);
  const [scheduleId, setScheduleId] = useState(teacherSchedules[0]?.id ?? '');
  const [date, setDate] = useState(academicDateReference);
  const [meeting, setMeeting] = useState(9);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'info' | 'success' | 'warning'; text: string } | null>(null);
  useActionNotifier(message);

  if (!teacher) {
    return null;
  }

  const selectedSchedule = teacherSchedules.find((item) => item.id === scheduleId) ?? teacherSchedules[0];
  const materialRows: MaterialRow[] = learningMaterials
    .filter((item) => item.teacherId === teacher.id)
    .map((item) => {
      const schedule = schedules.find((scheduleItem) => scheduleItem.id === item.scheduleId);
      return {
        id: item.id,
        date: item.date,
        className: classes.find((classItem) => classItem.id === schedule?.classId)?.name ?? '-',
        subject: subjects.find((subjectItem) => subjectItem.id === schedule?.subjectId)?.name ?? '-',
        meeting: item.meeting,
        title: item.title,
        status: item.validationStatus,
      };
    })
    .sort((first, second) => second.date.localeCompare(first.date));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSchedule) {
      setMessage({ tone: 'warning', text: 'Pilih jadwal guru terlebih dahulu.' });
      return;
    }

    setIsSaving(true);
    const result = await addLearningMaterial({
      teacherId: teacher.id,
      scheduleId: selectedSchedule.id,
      date,
      meeting,
      title,
      description,
    });
    setIsSaving(false);

    setMessage({ tone: result.success ? 'success' : 'warning', text: result.message });
    if (result.success) {
      setTitle('');
      setDescription('');
    }
  };

  const columns: TableColumn<MaterialRow>[] = [
    { key: 'date', header: 'Tanggal', render: (item) => formatDateID(item.date) },
    { key: 'className', header: 'Kelas', render: (item) => item.className },
    { key: 'subject', header: 'Mata Pelajaran', render: (item) => item.subject },
    { key: 'meeting', header: 'Pertemuan', render: (item) => item.meeting },
    { key: 'title', header: 'Judul Materi', render: (item) => item.title },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'Valid' ? 'green' : item.status === 'Ditolak' ? 'red' : 'yellow'}>
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Input Materi"
        description="Guru menginput materi pembelajaran dan membuat pretest serta posttest dalam satu halaman."
      />

      {message ? <InfoAlert tone={message.tone} message={message.text} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-bold text-slate-900">Form Materi Pembelajaran</h2>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Jadwal Guru</span>
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
                <span>Tanggal</span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Pertemuan ke-</span>
                <input
                  type="number"
                  min={1}
                  value={meeting}
                  onChange={(event) => setMeeting(Number(event.target.value))}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                />
              </label>
            </div>

            {selectedSchedule ? (
              <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                <p className="text-sm font-semibold text-brand-700">Jadwal terpilih</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {classes.find((item) => item.id === selectedSchedule.classId)?.name} •{' '}
                  {subjects.find((item) => item.id === selectedSchedule.subjectId)?.name} •{' '}
                  {selectedSchedule.startTime} - {selectedSchedule.endTime}
                </p>
              </div>
            ) : null}

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Judul Materi</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                placeholder="Contoh: Normalisasi 1NF sampai 3NF"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Deskripsi / Catatan Pembelajaran</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                placeholder="Jelaskan garis besar materi, aktivitas pembelajaran, atau catatan kelas."
              />
            </label>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Materi'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Materi Terbaru</h2>
              <p className="mt-1 text-sm text-slate-500">Ringkasan materi guru yang sudah tersimpan di sistem.</p>
            </div>
            <Badge variant="blue">{materialRows.length} data</Badge>
          </div>

          <div className="mt-6 max-h-[430px] space-y-4 overflow-y-auto pr-2">
            {materialRows.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-3xl border border-brand-100 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.className} • {item.subject} • Pertemuan {item.meeting}
                    </p>
                  </div>
                  <Badge variant={item.status === 'Valid' ? 'green' : item.status === 'Ditolak' ? 'red' : 'yellow'}>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <DataTable
        data={materialRows}
        columns={columns}
        getRowKey={(item) => item.id}
        emptyTitle="Materi belum tersedia"
        emptyDescription="Belum ada materi yang diinput guru pada data mock saat ini."
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pretest & Posttest</h2>
          <p className="mt-1 text-sm text-slate-500">
            Buat paket soal pilihan ganda untuk jadwal dan pertemuan materi yang sama.
          </p>
        </div>
        <GuruAssessmentSection showHeader={false} />
      </section>
    </div>
  );
}
