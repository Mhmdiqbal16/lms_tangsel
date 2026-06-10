import { FormEvent, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { InfoAlert } from '@/components/ui/InfoAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';

export function SiswaAkunPage() {
  const { session } = useAuth();
  const { students, classes, updateOwnPassword, updateStudentAccount } = useAppData();
  const student = students.find((item) => item.id === session?.referenceId);
  const classInfo = classes.find((item) => item.id === student?.classId);
  const [message, setMessage] = useState<{ tone: 'info' | 'success' | 'warning'; text: string } | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    avatar: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!student) {
      return;
    }

    setProfileForm({
      name: student.name,
      email: student.email,
      avatar: student.avatar,
    });
  }, [student?.avatar, student?.email, student?.id, student?.name]);

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!student) {
      return;
    }

    const result = updateStudentAccount({
      studentId: student.id,
      name: profileForm.name,
      email: profileForm.email,
      avatar: profileForm.avatar,
    });

    setMessage({ tone: result.success ? 'success' : 'warning', text: result.message });
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ tone: 'warning', text: 'Konfirmasi password baru belum sama.' });
      return;
    }

    const result = updateOwnPassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    setMessage({ tone: result.success ? 'success' : 'warning', text: result.message });

    if (result.success) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  if (!student) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Akun Siswa" description="Informasi profil siswa yang sedang aktif login di aplikasi." />

      {message ? <InfoAlert tone={message.tone} message={message.text} /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-brand-600 text-3xl font-bold text-white">
              {student.avatar}
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">{student.name}</h2>
            <p className="mt-1 text-sm text-slate-500">Siswa aktif pada Sistem Monitoring Pembelajaran</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge variant="blue">{classInfo?.name}</Badge>
              <Badge variant="green">NISN {student.nisn}</Badge>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-bold text-slate-900">Detail Akun</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">Nama</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{student.name}</p>
            </div>
            <div className="rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">NISN</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{student.nisn}</p>
            </div>
            <div className="rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">Kelas</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{classInfo?.name}</p>
            </div>
            <div className="rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">Email</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{student.email}</p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleProfileSubmit}>
            <h3 className="text-lg font-bold text-slate-900">Edit Profil</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                <span>Nama</span>
                <input
                  value={profileForm.name}
                  onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Inisial</span>
                <input
                  value={profileForm.avatar}
                  onChange={(event) => setProfileForm((current) => ({ ...current, avatar: event.target.value }))}
                  maxLength={3}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 uppercase outline-none"
                />
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Email</span>
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
              />
            </label>
            <button
              type="submit"
              className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
            >
              Simpan Profil
            </button>
          </form>

          <form className="mt-8 space-y-4 border-t border-brand-100 pt-6" onSubmit={handlePasswordSubmit}>
            <h3 className="text-lg font-bold text-slate-900">Ubah Password</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Password Lama</span>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Password Baru</span>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Konfirmasi</span>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                />
              </label>
            </div>
            <button
              type="submit"
              className="rounded-2xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Perbarui Password
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
