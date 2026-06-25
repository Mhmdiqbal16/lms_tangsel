import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  Loader2,
  LockKeyhole,
  UserCircle2,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/ToastContext';
import { getHomeRoute } from '@/utils/businessRules';

const schoolPhotoSlides = [
  '/school-photos/sekolah-1.jpg',
  '/school-photos/sekolah-2.jpg',
  '/school-photos/sekolah-3.jpg',
  '/school-photos/sekolah-4.jpg',
];

export function LoginPage() {
  const navigate = useNavigate();
  const { session, isAuthLoading, login } = useAuth();
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActivePhotoIndex((current) => (current + 1) % schoolPhotoSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  if (isAuthLoading) {
    return null;
  }

  if (session) {
    return <Navigate to={getHomeRoute(session.role)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login({ identifier, password });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message);
      showToast({ tone: 'warning', message: result.message });
      return;
    }

    showToast({ tone: 'success', message: result.message });
    navigate(getHomeRoute(result.role ?? 'siswa'), { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent px-3 py-6 md:px-5 lg:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.18),transparent_25%),radial-gradient(circle_at_left,rgba(191,219,254,0.8),transparent_30%)]" />
      <div className="relative mx-auto grid w-full max-w-[1320px] items-center gap-6 xl:gap-8 lg:grid-cols-[1.04fr_0.9fr]">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative flex h-full flex-col justify-between overflow-hidden rounded-[32px] border border-brand-100 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-8 text-white shadow-soft lg:min-h-[680px]"
        >
          <div className="absolute inset-0">
            {schoolPhotoSlides.map((photo, index) => (
              <motion.div
                key={photo}
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center blur-sm"
                style={{ backgroundImage: `url(${photo})` }}
                initial={false}
                animate={{
                  opacity: activePhotoIndex === index ? 0.68 : 0,
                  scale: activePhotoIndex === index ? 1.06 : 1,
                }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
            ))}
            <div className="absolute inset-0 bg-brand-950/55" />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-800/75 via-brand-700/50 to-brand-500/35" />
          </div>

          <div className="relative z-10">
            <Badge variant="blue" className="bg-white/15 text-white ring-white/20">
              Portal Akademik SMKN 2
            </Badge>
            <h1 className="mt-6 max-w-xl text-4xl font-extrabold leading-tight md:text-5xl">
              Sistem Monitoring Pembelajaran
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-brand-50/95">
              Silakan login menggunakan identitas sekolah. Siswa masuk dengan NISN, sedangkan guru, kurikulum, dan
              tenaga kependidikan masuk menggunakan NIP.
            </p>
          </div>

          <div className="relative z-10 mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/15 p-3">
                  <IdCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-100">Informasi</p>
                  <p className="mt-1 text-sm leading-6 text-brand-50/90">
                    Gunakan NISN untuk akun siswa, sedangkan guru dan kurikulum menggunakan NIP yang sudah terdaftar.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/15 p-3">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-100">Informasi</p>
                  <p className="mt-1 text-sm leading-6 text-brand-50/90">
                    Pastikan password benar dan jangan membagikan akun kepada orang lain demi keamanan data sekolah.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-[32px] border border-white/60 bg-white/90 p-6 shadow-soft backdrop-blur md:p-8 lg:min-h-[680px] lg:self-center"
        >
          <div className="flex items-center gap-3">
            <img src="/logosmk.webp" alt="Logo SMKN 2" className="h-12 w-12 object-contain" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-500">Portal Akademik SMKN 2</p>
              <h2 className="text-2xl font-bold text-slate-900">Masuk ke dashboard</h2>
            </div>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm leading-6 text-slate-600">
                Akses mudah ke Portal Akademik SMKN 2. Memudahkan dalam memonitoring pembelajaran, absensi, dan informasi penting lainnya. Login sekarang untuk pengalaman belajar yang lebih baik!
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="identifier" className="text-sm font-semibold text-slate-700">
                Username
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3">
                <UserCircle2 className="h-5 w-5 text-brand-500" />
                <input
                  id="identifier"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="w-full border-none bg-transparent outline-none placeholder:text-slate-400"
                  placeholder="Masukan NISN/NIP"
                />
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Siswa login menggunakan NISN. Guru mata pelajaran, guru piket, dan bidang kurikulum login menggunakan
                NIP.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3">
                <LockKeyhole className="h-5 w-5 text-brand-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full border-none bg-transparent outline-none placeholder:text-slate-400"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-slate-500 transition hover:text-brand-600"
                  aria-label="Tampilkan password"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Tidak bisa login atau lupa password? Silakan menghubungi pihak operator sekolah.
              </p>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-4 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {isSubmitting ? 'Memproses...' : 'Login Sekarang'}
            </button>
          </form>
        </motion.section>
      </div>
    </div>
  );
}
