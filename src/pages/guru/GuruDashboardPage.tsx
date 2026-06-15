import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { academicDateReference } from '@/data/mockData';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { differenceInCalendarDays, formatDateID, parseISODate } from '@/utils/date';
import { BookOpenText, CalendarDays, ClipboardCheck, NotebookPen, Users } from 'lucide-react';

export function GuruDashboardPage() {
  const { session } = useAuth();
  const { teachers, schedules, classes, subjects, teacherAttendances, studentJournals, learningMaterials } = useAppData();
  const teacher = teachers.find((item) => item.id === session?.referenceId);
  const today = parseISODate(academicDateReference);

  if (!teacher) {
    return null;
  }

  const todaySchedules = schedules.filter((item) => item.teacherId === teacher.id && item.day === today.getDay());
  const todayAttendanceRecords = teacherAttendances.filter(
    (item) => item.teacherId === teacher.id && item.date === academicDateReference,
  );
  const completedPresensiCount = todaySchedules.filter((schedule) =>
    todayAttendanceRecords.some((record) => record.scheduleId === schedule.id),
  ).length;
  const presensiStatus =
    todaySchedules.length === 0
      ? 'Tidak ada'
      : completedPresensiCount === 0
        ? 'Belum'
        : completedPresensiCount === todaySchedules.length
          ? 'Selesai'
          : `${completedPresensiCount}/${todaySchedules.length} sesi`;
  const presensiDescription =
    todaySchedules.length === 0
      ? 'Tidak ada jadwal mengajar yang perlu dipresensi hari ini.'
      : completedPresensiCount === 0
        ? 'Belum ada presensi mengajar yang tercatat untuk jadwal hari ini.'
        : completedPresensiCount === todaySchedules.length
          ? 'Semua jadwal mengajar hari ini sudah tercatat presensinya.'
          : `${completedPresensiCount} dari ${todaySchedules.length} jadwal hari ini sudah tercatat presensinya.`;
  const journalCountToday = studentJournals.filter((journal) => {
    const schedule = schedules.find((item) => item.id === journal.scheduleId);
    return schedule?.teacherId === teacher.id && journal.date === academicDateReference;
  }).length;
  const materialsWeek = learningMaterials.filter(
    (item) => item.teacherId === teacher.id && differenceInCalendarDays(academicDateReference, item.date) <= 6,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Guru"
        description={`Ringkasan aktivitas mengajar ${teacher.name} pada ${formatDateID(academicDateReference)}.`}
      />

      <div className="grid gap-5 lg:grid-cols-4">
        <StatCard
          title="Jadwal Hari Ini"
          value={todaySchedules.length}
          description="Total sesi mengajar yang terjadwal pada hari aktif sekolah."
          icon={CalendarDays}
        />
        <StatCard
          title="Jumlah Kelas"
          value={new Set(todaySchedules.map((item) => item.classId)).size}
          description="Jumlah kelas berbeda yang diajar hari ini."
          icon={Users}
        />
        <StatCard
          title="Status Presensi"
          value={presensiStatus}
          description={presensiDescription}
          icon={ClipboardCheck}
        />
        <StatCard
          title="Jurnal Siswa Masuk"
          value={journalCountToday}
          description="Jumlah jurnal siswa yang sudah masuk untuk mapel guru pada hari ini."
          icon={NotebookPen}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Jadwal Hari Ini</h2>
              <p className="mt-1 text-sm text-slate-500">Daftar kelas yang akan atau sedang diajar oleh guru.</p>
            </div>
            <Badge variant="blue">{todaySchedules.length} sesi</Badge>
          </div>

          <div className="mt-6 max-h-[420px] space-y-4 overflow-y-auto pr-2">
            {todaySchedules.map((schedule) => {
              const className = classes.find((item) => item.id === schedule.classId)?.name;
              const subject = subjects.find((item) => item.id === schedule.subjectId)?.name;
              const attendance = todayAttendanceRecords.find((item) => item.scheduleId === schedule.id);
              return (
                <div key={schedule.id} className="rounded-3xl border border-brand-100 bg-brand-50/60 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{subject}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {className} • {schedule.room}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="blue">
                        {schedule.startTime} - {schedule.endTime}
                      </Badge>
                      <Badge variant={attendance?.status === 'Hadir' ? 'green' : attendance ? 'yellow' : 'slate'}>
                        {attendance?.status ?? 'Belum presensi'}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
              <BookOpenText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Materi Minggu Ini</h2>
              <p className="text-sm text-slate-500">Ringkasan materi yang sudah diinput pada minggu berjalan.</p>
            </div>
          </div>

          <div className="mt-6 max-h-[480px] space-y-4 overflow-y-auto pr-2">
            {materialsWeek.map((material) => {
              const schedule = schedules.find((item) => item.id === material.scheduleId);
              const className = classes.find((item) => item.id === schedule?.classId)?.name;
              const subject = subjects.find((item) => item.id === schedule?.subjectId)?.name;
              return (
                <div key={material.id} className="rounded-3xl border border-brand-100 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{material.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {className} • {subject} • Pertemuan {material.meeting}
                      </p>
                    </div>
                    <Badge variant={material.validationStatus === 'Valid' ? 'green' : material.validationStatus === 'Ditolak' ? 'red' : 'yellow'}>
                      {material.validationStatus}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{material.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
