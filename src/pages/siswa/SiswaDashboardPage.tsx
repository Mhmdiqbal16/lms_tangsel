import { motion } from 'framer-motion';
import { Bell, BookOpenText, CalendarDays, NotebookPen } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { academicDateReference } from '@/data/mockData';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { getJournalEligibility } from '@/utils/businessRules';
import { formatDateID, formatDayName, parseISODate } from '@/utils/date';

const statusVariantMap = {
  Selesai: 'green',
  Belum: 'yellow',
  Terkunci: 'red',
} as const;

export function SiswaDashboardPage() {
  const { session } = useAuth();
  const {
    students,
    classes,
    schedules,
    subjects,
    teachers,
    notifications,
    studentJournals,
    assessments,
    questionnaires,
  } = useAppData();

  const student = students.find((item) => item.id === session?.referenceId);

  if (!student) {
    return <EmptyState title="Data siswa tidak ditemukan" description="Profil siswa belum tersedia pada mock data." icon={NotebookPen} />;
  }

  const today = parseISODate(academicDateReference);
  const todaySchedules = schedules.filter((item) => item.classId === student.classId && item.day === today.getDay());
  const currentClass = classes.find((item) => item.id === student.classId);
  const todayJournalCount = studentJournals.filter(
    (item) => item.studentId === student.id && item.date === academicDateReference,
  ).length;
  const pendingJournalCount = todaySchedules.filter(
    (schedule) =>
      !studentJournals.some(
        (journal) =>
          journal.studentId === student.id &&
          journal.scheduleId === schedule.id &&
          journal.date === academicDateReference,
      ),
  ).length;
  const roleNotifications = notifications.filter((item) => item.role === 'siswa' || item.role === 'all');

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader
        title="Dashboard Siswa"
        description={`Ringkasan aktivitas belajar ${student.name} pada ${formatDateID(academicDateReference)} untuk kelas ${currentClass?.name}.`}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <StatCard
          title="Jurnal Hari Ini"
          value={`${todayJournalCount}/${todaySchedules.length || 0}`}
          description="Jumlah jurnal yang sudah diisi dibandingkan dengan total mapel pada hari aktif sekolah."
          icon={NotebookPen}
        />
        <StatCard
          title="Jurnal Belum Diisi"
          value={pendingJournalCount}
          description="Jumlah jadwal hari ini yang belum memiliki jurnal pembelajaran."
          icon={NotebookPen}
        />
        <StatCard
          title="Mapel Hari Ini"
          value={todaySchedules.length}
          description="Jumlah pelajaran yang terjadwal untuk kelas aktif pada hari ini."
          icon={BookOpenText}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Jadwal Hari Ini</h2>
              <p className="mt-1 text-sm text-slate-500">Daftar pelajaran aktif sesuai kelas dan hari berjalan.</p>
            </div>
            <Badge variant="blue">{formatDayName(academicDateReference)}</Badge>
          </div>

          <div className="mt-6 max-h-[420px] space-y-4 overflow-y-auto pr-2">
            {todaySchedules.length === 0 ? (
              <EmptyState title="Belum ada jadwal" description="Tidak ada jadwal belajar pada hari aktif ini." icon={CalendarDays} />
            ) : (
              todaySchedules.map((schedule) => {
                const subject = subjects.find((item) => item.id === schedule.subjectId);
                const teacher = teachers.find((item) => item.id === schedule.teacherId);
                return (
                  <div key={schedule.id} className="rounded-3xl border border-brand-100 bg-brand-50/60 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{subject?.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {teacher?.name} • {schedule.room}
                        </p>
                      </div>
                      <Badge variant="blue">
                        {schedule.startTime} - {schedule.endTime}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Notifikasi</h2>
              <p className="text-sm text-slate-500">Informasi penting yang terkait dengan kegiatan pembelajaran.</p>
            </div>
          </div>

          <div className="mt-6 max-h-[420px] space-y-4 overflow-y-auto pr-2">
            {roleNotifications.map((item) => (
              <div key={item.id} className="rounded-3xl border border-brand-100 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <Badge variant={item.type === 'warning' ? 'yellow' : item.type === 'success' ? 'green' : 'blue'}>
                    {formatDateID(item.date)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Status Pretest, Posttest, Kuisioner, dan Jurnal</h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitoring kesiapan jurnal untuk setiap pelajaran yang sedang berjalan hari ini.
            </p>
          </div>
          <Badge variant="blue">Live Mock</Badge>
        </div>

        <div className="mt-6 grid max-h-[560px] gap-4 overflow-y-auto pr-2 xl:grid-cols-2">
          {todaySchedules.map((schedule) => {
            const subject = subjects.find((item) => item.id === schedule.subjectId);
            const teacher = teachers.find((item) => item.id === schedule.teacherId);
            const eligibility = getJournalEligibility({
              studentId: student.id,
              scheduleId: schedule.id,
              sessionDate: academicDateReference,
              journals: studentJournals,
              assessments,
              questionnaires,
              currentDate: academicDateReference,
            });

            return (
              <div key={schedule.id} className="rounded-3xl border border-brand-100 bg-brand-50/60 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{subject?.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{teacher?.name}</p>
                  </div>
                  <Badge variant={statusVariantMap[eligibility.status]}>{eligibility.status}</Badge>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-medium text-slate-500">Pretest</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {eligibility.pretestDone ? 'Selesai' : 'Belum selesai'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-medium text-slate-500">Posttest</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {eligibility.posttestDone ? 'Selesai' : 'Belum selesai'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-medium text-slate-500">Kuisioner Guru</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {eligibility.questionnaireDone ? 'Sudah diisi' : 'Belum diisi'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-medium text-slate-500">Akses Jurnal</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {eligibility.canSubmit ? 'Siap diisi' : eligibility.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}
