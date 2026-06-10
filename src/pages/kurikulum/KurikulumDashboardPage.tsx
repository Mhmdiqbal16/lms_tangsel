import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { academicDateReference } from '@/data/mockData';
import { useAppData } from '@/hooks/useAppData';
import { BookOpenText, ClipboardCheck, NotebookPen, Presentation } from 'lucide-react';
import { formatDateID, formatShortDateID, getRecentSchoolDates, parseISODate, toISODate } from '@/utils/date';

export function KurikulumDashboardPage() {
  const { teacherAttendances, schedules, classes, teachers, learningMaterials, studentJournals, students } = useAppData();
  const todayAttendances = teacherAttendances.filter(
    (item) => item.date === academicDateReference && item.status === 'Hadir',
  );
  const activeClassesToday = new Set(
    teacherAttendances
      .filter((item) => item.date === academicDateReference)
      .map((item) => schedules.find((schedule) => schedule.id === item.scheduleId)?.classId ?? ''),
  );
  const chartData = getRecentSchoolDates(5, parseISODate(academicDateReference))
    .reverse()
    .map((date) => {
      const isoDate = toISODate(date);
      return {
        label: formatShortDateID(isoDate),
        guruHadir: teacherAttendances.filter((item) => item.date === isoDate && item.status === 'Hadir').length,
        jurnalMasuk: studentJournals.filter((item) => item.date === isoDate).length,
      };
    });

  const latestActivities = [
    ...teacherAttendances.map((item) => {
      const teacher = teachers.find((teacherItem) => teacherItem.id === item.teacherId)?.name ?? '-';
      const schedule = schedules.find((scheduleItem) => scheduleItem.id === item.scheduleId);
      return {
        id: item.id,
        date: item.date,
        title: `${teacher} melakukan presensi mengajar`,
        detail: `${classes.find((classItem) => classItem.id === schedule?.classId)?.name} • ${item.status}`,
      };
    }),
    ...learningMaterials.map((item) => {
      const teacher = teachers.find((teacherItem) => teacherItem.id === item.teacherId)?.name ?? '-';
      return {
        id: item.id,
        date: item.date,
        title: `${teacher} menginput materi pembelajaran`,
        detail: item.title,
      };
    }),
    ...studentJournals.map((item) => {
      const student = students.find((studentItem) => studentItem.id === item.studentId)?.name ?? '-';
      return {
        id: item.id,
        date: item.date,
        title: `${student} mengirim jurnal siswa`,
        detail: item.materialStudied,
      };
    }),
  ]
    .sort((first, second) => second.date.localeCompare(first.date))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Monitoring"
        description={`Monitoring pembelajaran sekolah secara menyeluruh pada ${formatDateID(academicDateReference)}.`}
      />

      <div className="grid gap-5 lg:grid-cols-4">
        <StatCard
          title="Guru Hadir Hari Ini"
          value={new Set(todayAttendances.map((item) => item.teacherId)).size}
          description="Jumlah guru yang tercatat hadir mengajar pada hari aktif."
          icon={ClipboardCheck}
        />
        <StatCard
          title="Jumlah Kelas Aktif"
          value={activeClassesToday.size}
          description="Kelas dengan aktivitas pembelajaran berdasarkan presensi guru."
          icon={Presentation}
        />
        <StatCard
          title="Jurnal Siswa Masuk"
          value={studentJournals.filter((item) => item.date === academicDateReference).length}
          description="Total jurnal siswa yang masuk pada hari aktif sekolah."
          icon={NotebookPen}
        />
        <StatCard
          title="Materi Hari Ini"
          value={learningMaterials.filter((item) => item.date === academicDateReference).length}
          description="Jumlah materi pembelajaran yang diinput guru pada hari ini."
          icon={BookOpenText}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Grafik Monitoring</h2>
              <p className="mt-1 text-sm text-slate-500">Perbandingan guru hadir dan jurnal siswa masuk per hari.</p>
            </div>
            <Badge variant="blue">5 hari sekolah terakhir</Badge>
          </div>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Bar dataKey="guruHadir" fill="#2563eb" radius={[10, 10, 0, 0]} />
                <Bar dataKey="jurnalMasuk" fill="#60a5fa" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-bold text-slate-900">Aktivitas Terbaru</h2>
          <div className="mt-6 max-h-[480px] space-y-4 overflow-y-auto pr-2">
            {latestActivities.map((activity) => (
              <div key={activity.id} className="rounded-3xl border border-brand-100 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{activity.title}</p>
                  <Badge variant="blue">{formatDateID(activity.date)}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{activity.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
