import { FormEvent, useEffect, useState } from 'react';
import { InfoAlert } from '@/components/ui/InfoAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';

export function GuruProfilPage() {
  const { session } = useAuth();
  const { teachers, subjects, updateOwnPassword, updateTeacherProfile } = useAppData();
  const teacher = teachers.find((item) => item.id === session?.referenceId);
  const [message, setMessage] = useState<{ tone: 'info' | 'success' | 'warning'; text: string } | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    subjectIds: [] as string[],
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!teacher) {
      return;
    }

    setProfileForm({
      name: teacher.name,
      email: teacher.email,
      subjectIds: teacher.subjectIds,
    });
  }, [teacher?.email, teacher?.id, teacher?.name, teacher?.subjectIds]);

  const toggleSubject = (subjectId: string) => {
    setProfileForm((current) => ({
      ...current,
      subjectIds: current.subjectIds.includes(subjectId)
        ? current.subjectIds.filter((item) => item !== subjectId)
        : [...current.subjectIds, subjectId],
    }));
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!teacher) {
      return;
    }

    const result = updateTeacherProfile({
      teacherId: teacher.id,
      name: profileForm.name,
      email: profileForm.email,
      subjectIds: profileForm.subjectIds,
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

  if (!teacher) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profil Guru" description="Informasi profil guru yang aktif menggunakan sistem." />

      {message ? <InfoAlert tone={message.tone} message={message.text} /> : null}

      <section className="min-w-0 rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
        <div className="space-y-6">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-brand-600 text-2xl font-bold text-white sm:h-24 sm:w-24 sm:text-3xl">
              {teacher.name
                .split(' ')
                .slice(0, 2)
                .map((item) => item[0])
                .join('')}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">Detail Profil</p>
              <h2 className="mt-2 break-words text-2xl font-bold text-slate-900 [overflow-wrap:anywhere]">
                {teacher.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Guru aktif Sistem Monitoring Pembelajaran</p>
            </div>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-3">
            <div className="min-w-0 rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">NIP Dummy</p>
              <p className="mt-2 break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere]">
                {teacher.nip}
              </p>
            </div>
            <div className="min-w-0 rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">Mapel</p>
              <p className="mt-2 break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere]">
                {teacher.subjectIds.map((subjectId) => subjects.find((item) => item.id === subjectId)?.name).join(', ')}
              </p>
            </div>
            <div className="min-w-0 rounded-2xl bg-brand-50/60 p-4">
              <p className="text-sm font-medium text-slate-500">Email</p>
              <p className="mt-2 break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere]">
                {teacher.email}
              </p>
            </div>
          </div>

          <form className="space-y-4 border-t border-brand-100 pt-6" onSubmit={handleProfileSubmit}>
            <h3 className="text-lg font-bold text-slate-900">Edit Profil</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Nama Guru</span>
                <input
                  value={profileForm.name}
                  onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Email</span>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 outline-none"
                />
              </label>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Mata Pelajaran Diampu</p>
              <div className="grid gap-3 md:grid-cols-2">
                {subjects.map((subject) => (
                  <label
                    key={subject.id}
                    className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={profileForm.subjectIds.includes(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="h-4 w-4 accent-brand-600"
                    />
                    <span>{subject.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
            >
              Simpan Profil
            </button>
          </form>

          <form className="space-y-4 border-t border-brand-100 pt-6" onSubmit={handlePasswordSubmit}>
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
