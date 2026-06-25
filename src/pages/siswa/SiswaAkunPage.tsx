import { InfoAlert } from '@/components/ui/InfoAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';

export function SiswaAkunPage() {
  const { session } = useAuth();
  const { students, classes } = useAppData();
  const student = students.find((item) => item.id === session?.referenceId);
  const classInfo = classes.find((item) => item.id === student?.classId);

  if (!student) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Akun Siswa" description="Informasi profil siswa yang sedang aktif login di aplikasi." />

      <InfoAlert
        tone="info"
        message="Data profil dan password akun siswa hanya dapat diubah oleh admin melalui menu Data Master."
      />

      <section className="min-w-0 rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
        <div className="space-y-6">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-brand-600 text-2xl font-bold text-white sm:h-24 sm:w-24 sm:text-3xl">
              {student.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">Detail Akun</p>
              <h2 className="mt-2 break-words text-2xl font-bold text-slate-900 [overflow-wrap:anywhere]">
                {student.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Siswa aktif pada Sistem Monitoring Pembelajaran</p>
            </div>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-3">
            <div className="min-w-0 rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">NISN</p>
              <p className="mt-2 break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere]">
                {student.nisn}
              </p>
            </div>
            <div className="min-w-0 rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">Kelas</p>
              <p className="mt-2 break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere]">
                {classInfo?.name ?? '-'}
              </p>
            </div>
            <div className="min-w-0 rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">Email</p>
              <p className="mt-2 break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere]">
                {student.email}
              </p>
            </div>
            <div className="min-w-0 rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">Hak Perubahan Data</p>
              <p className="mt-2 break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere]">
                Operator Sekolah
              </p>
            </div>
            <div className="min-w-0 rounded-2xl bg-brand-50/60 p-4 md:col-span-2">
              <p className="text-sm font-medium text-slate-500">Keterangan</p>
              <p className="mt-2 break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere]">
                Hubungi admin jika ada perubahan nama, email, kelas, NISN, inisial, atau password.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
