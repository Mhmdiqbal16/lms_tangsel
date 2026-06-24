import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminMasterDataPage } from '@/pages/admin/AdminMasterDataPage';
import { GuruDashboardPage } from '@/pages/guru/GuruDashboardPage';
import { GuruHasilAssessmentPage } from '@/pages/guru/GuruHasilAssessmentPage';
import { GuruJurnalSiswaPage } from '@/pages/guru/GuruJurnalSiswaPage';
import { GuruMateriPage } from '@/pages/guru/GuruMateriPage';
import { GuruPresensiPage } from '@/pages/guru/GuruPresensiPage';
import { GuruProfilPage } from '@/pages/guru/GuruProfilPage';
import { GuruRiwayatPage } from '@/pages/guru/GuruRiwayatPage';
import { KurikulumDashboardPage } from '@/pages/kurikulum/KurikulumDashboardPage';
import { KurikulumHasilKuisionerPage } from '@/pages/kurikulum/KurikulumHasilKuisionerPage';
import { KurikulumJurnalSiswaPage } from '@/pages/kurikulum/KurikulumJurnalSiswaPage';
import { KurikulumKehadiranGuruPage } from '@/pages/kurikulum/KurikulumKehadiranGuruPage';
import { KurikulumLaporanPage } from '@/pages/kurikulum/KurikulumLaporanPage';
import { KurikulumMonitoringMateriPage } from '@/pages/kurikulum/KurikulumMonitoringMateriPage';
import { KurikulumProfilPage } from '@/pages/kurikulum/KurikulumProfilPage';
import { KurikulumValidasiPage } from '@/pages/kurikulum/KurikulumValidasiPage';
import { SiswaAbsensiPage } from '@/pages/siswa/SiswaAbsensiPage';
import { SiswaAkunPage } from '@/pages/siswa/SiswaAkunPage';
import { SiswaAssessmentPage } from '@/pages/siswa/SiswaAssessmentPage';
import { SiswaDashboardPage } from '@/pages/siswa/SiswaDashboardPage';
import { SiswaJadwalPage } from '@/pages/siswa/SiswaJadwalPage';
import { SiswaJurnalPage } from '@/pages/siswa/SiswaJurnalPage';
import { SiswaKuisionerPage } from '@/pages/siswa/SiswaKuisionerPage';
import { SiswaRiwayatJurnalPage } from '@/pages/siswa/SiswaRiwayatJurnalPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleLandingRedirect } from '@/routes/RoleLandingRedirect';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleLandingRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute allowedRoles={['siswa']} />}>
          <Route element={<DashboardLayout />}>
            <Route element={<ProtectedRoute allowedRoles={['siswa']} requiredPermission="dashboard.view" />}>
              <Route path="/siswa/dashboard" element={<SiswaDashboardPage />} />
            </Route>
            <Route
              element={<ProtectedRoute allowedRoles={['siswa']} requiredPermission="student.attendance.view" />}
            >
              <Route path="/siswa/absensi" element={<SiswaAbsensiPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['siswa']} requiredPermission="schedule.view" />}>
              <Route path="/siswa/jadwal" element={<SiswaJadwalPage />} />
            </Route>
            <Route
              element={<ProtectedRoute allowedRoles={['siswa']} requiredPermission="student.journal.create" />}
            >
              <Route path="/siswa/jurnal" element={<SiswaJurnalPage />} />
              <Route path="/siswa/pretest" element={<SiswaAssessmentPage type="pretest" />} />
              <Route path="/siswa/posttest" element={<SiswaAssessmentPage type="posttest" />} />
              <Route path="/siswa/kuisioner" element={<SiswaKuisionerPage />} />
            </Route>
            <Route
              element={
                <ProtectedRoute allowedRoles={['siswa']} requiredPermission="student.journal.view_history" />
              }
            >
              <Route path="/siswa/riwayat-jurnal" element={<SiswaRiwayatJurnalPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['siswa']} requiredPermission="account.view_own" />}>
              <Route path="/siswa/akun" element={<SiswaAkunPage />} />
            </Route>
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['guru']} />}>
          <Route element={<DashboardLayout />}>
            <Route element={<ProtectedRoute allowedRoles={['guru']} requiredPermission="dashboard.view" />}>
              <Route path="/guru/dashboard" element={<GuruDashboardPage />} />
            </Route>
            <Route
              element={<ProtectedRoute allowedRoles={['guru']} requiredPermission="teacher.attendance.create" />}
            >
              <Route path="/guru/presensi" element={<GuruPresensiPage />} />
            </Route>
            <Route
              element={<ProtectedRoute allowedRoles={['guru']} requiredPermission="learning.material.create" />}
            >
              <Route path="/guru/materi" element={<GuruMateriPage />} />
            </Route>
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['guru']}
                  requiredPermission="student.journal.view_taught_classes"
                />
              }
            >
              <Route path="/guru/jurnal-siswa" element={<GuruJurnalSiswaPage />} />
            </Route>
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['guru']}
                  requiredPermission="assessment.result.view_taught_classes"
                />
              }
            >
              <Route path="/guru/hasil-test" element={<GuruHasilAssessmentPage />} />
            </Route>
            <Route path="/guru/test" element={<Navigate to="/guru/materi" replace />} />
            <Route
              element={<ProtectedRoute allowedRoles={['guru']} requiredPermission="teaching.history.view_own" />}
            >
              <Route path="/guru/riwayat" element={<GuruRiwayatPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['guru']} requiredPermission="account.view_own" />}>
              <Route path="/guru/profil" element={<GuruProfilPage />} />
            </Route>
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['kurikulum']} />}>
          <Route element={<DashboardLayout />}>
            <Route
              element={<ProtectedRoute allowedRoles={['kurikulum']} requiredPermission="dashboard.monitor" />}
            >
              <Route path="/kurikulum/dashboard" element={<KurikulumDashboardPage />} />
            </Route>
            <Route
              element={
                <ProtectedRoute allowedRoles={['kurikulum']} requiredPermission="teacher.attendance.monitor" />
              }
            >
              <Route path="/kurikulum/kehadiran-guru" element={<KurikulumKehadiranGuruPage />} />
            </Route>
            <Route
              element={
                <ProtectedRoute allowedRoles={['kurikulum']} requiredPermission="learning.material.monitor" />
              }
            >
              <Route path="/kurikulum/monitoring-materi" element={<KurikulumMonitoringMateriPage />} />
            </Route>
            <Route
              element={<ProtectedRoute allowedRoles={['kurikulum']} requiredPermission="student.journal.monitor" />}
            >
              <Route path="/kurikulum/jurnal-siswa" element={<KurikulumJurnalSiswaPage />} />
            </Route>
            <Route
              element={<ProtectedRoute allowedRoles={['kurikulum']} requiredPermission="questionnaire.result.view" />}
            >
              <Route path="/kurikulum/hasil-kuisioner" element={<KurikulumHasilKuisionerPage />} />
            </Route>
            <Route path="/kurikulum/hasil-posttest" element={<Navigate to="/kurikulum/hasil-kuisioner" replace />} />
            <Route element={<ProtectedRoute allowedRoles={['kurikulum']} requiredPermission="report.view" />}>
              <Route path="/kurikulum/laporan" element={<KurikulumLaporanPage />} />
            </Route>
            <Route
              element={<ProtectedRoute allowedRoles={['kurikulum']} requiredPermission="validation.manage" />}
            >
              <Route path="/kurikulum/validasi" element={<KurikulumValidasiPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['kurikulum']} requiredPermission="account.view_own" />}>
              <Route path="/kurikulum/profil" element={<KurikulumProfilPage />} />
            </Route>
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="admin.dashboard.view" />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['admin']} requiredPermission="master.data.manage" />}>
              <Route path="/admin/data-master" element={<AdminMasterDataPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
