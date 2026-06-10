import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { useAppData } from '@/hooks/useAppData';
import { BookOpenText, Building2, Database, NotebookPen, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminDashboardPage() {
  const { reportSummary, notifications } = useAppData();
  const adminNotifications = notifications.filter((item) => item.role === 'admin' || item.role === 'all');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Admin"
        description="Ringkasan statistik sistem monitoring pembelajaran sekolah secara keseluruhan."
        actions={
          <Link
            to="/admin/data-master"
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
          >
            <Database className="h-4 w-4" />
            Data Master
          </Link>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Guru"
          value={reportSummary.totalTeachers}
          description="Jumlah guru yang tercatat pada data master sistem."
          icon={Users}
        />
        <StatCard
          title="Total Siswa"
          value={reportSummary.totalStudents}
          description="Jumlah siswa yang terhubung dengan data monitoring."
          icon={Users}
        />
        <StatCard
          title="Total Kelas"
          value={reportSummary.totalClasses}
          description="Jumlah kelas aktif pada struktur data sekolah."
          icon={Building2}
        />
        <StatCard
          title="Total Mata Pelajaran"
          value={reportSummary.totalSubjects}
          description="Jumlah mapel yang sudah dipakai pada jadwal dan monitoring."
          icon={BookOpenText}
        />
        <StatCard
          title="Total Jurnal"
          value={reportSummary.totalJournals}
          description="Akumulasi jurnal siswa yang sudah tersimpan di aplikasi."
          icon={NotebookPen}
        />
        <StatCard
          title="Total Presensi Guru"
          value={reportSummary.totalTeacherAttendances}
          description="Akumulasi presensi mengajar guru yang tersimpan di aplikasi."
          icon={ShieldCheck}
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-bold text-slate-900">Ringkasan Sistem</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">Backend API</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Supabase siap</p>
            </div>
            <div className="rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">Session Login</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Cookie backend</p>
            </div>
            <div className="rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">Role-based Routing</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Terlindungi</p>
            </div>
            <div className="rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">Data Monitoring</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Relasional dan realistis</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">Ringkasan Aktivitas</h2>
            <Badge variant="blue">Admin View</Badge>
          </div>
          <div className="mt-6 max-h-[420px] space-y-4 overflow-y-auto pr-2">
            {adminNotifications.map((item) => (
              <div key={item.id} className="rounded-3xl border border-brand-100 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <Badge variant="blue">{item.role === 'all' ? 'Global' : 'Admin'}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
