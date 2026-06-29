import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { useAppData } from '@/hooks/useAppData';
import { BookOpenText, Building2, Database, NotebookPen, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminDashboardPage() {
  const { reportSummary } = useAppData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Super Admin"
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
    </div>
  );
}
