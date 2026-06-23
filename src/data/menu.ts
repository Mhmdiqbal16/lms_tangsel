import {
  BarChart3,
  BookOpenCheck,
  BookOpenText,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileBarChart2,
  FileCheck2,
  LayoutDashboard,
  NotebookPen,
  ShieldCheck,
  UserCircle2,
  Users,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Permission, Role } from '@/types';

export interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permission: Permission;
}

export const menusByRole: Record<Role, MenuItem[]> = {
  siswa: [
    { label: 'Dashboard', path: '/siswa/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { label: 'Absensi', path: '/siswa/absensi', icon: ClipboardCheck, permission: 'student.attendance.view' },
    { label: 'Jadwal Pelajaran', path: '/siswa/jadwal', icon: CalendarClock, permission: 'schedule.view' },
    { label: 'Isi Jurnal', path: '/siswa/jurnal', icon: NotebookPen, permission: 'student.journal.create' },
    {
      label: 'Riwayat Jurnal',
      path: '/siswa/riwayat-jurnal',
      icon: ClipboardList,
      permission: 'student.journal.view_history',
    },
    { label: 'Akun', path: '/siswa/akun', icon: UserCircle2, permission: 'account.view_own' },
  ],
  guru: [
    { label: 'Dashboard', path: '/guru/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    {
      label: 'Presensi Mengajar',
      path: '/guru/presensi',
      icon: ClipboardCheck,
      permission: 'teacher.attendance.create',
    },
    {
      label: 'Input Materi',
      path: '/guru/materi',
      icon: BookOpenText,
      permission: 'learning.material.create',
    },
    {
      label: 'Jurnal Siswa',
      path: '/guru/jurnal-siswa',
      icon: NotebookPen,
      permission: 'student.journal.view_taught_classes',
    },
    { label: 'Pretest & Posttest', path: '/guru/test', icon: BookOpenCheck, permission: 'assessment.manage' },
    {
      label: 'Riwayat Mengajar',
      path: '/guru/riwayat',
      icon: ClipboardList,
      permission: 'teaching.history.view_own',
    },
    { label: 'Profil', path: '/guru/profil', icon: UserCircle2, permission: 'account.view_own' },
  ],
  kurikulum: [
    {
      label: 'Dashboard Monitoring',
      path: '/kurikulum/dashboard',
      icon: LayoutDashboard,
      permission: 'dashboard.monitor',
    },
    {
      label: 'Kehadiran Guru',
      path: '/kurikulum/kehadiran-guru',
      icon: Users,
      permission: 'teacher.attendance.monitor',
    },
    {
      label: 'Monitoring Materi',
      path: '/kurikulum/monitoring-materi',
      icon: BookOpenText,
      permission: 'learning.material.monitor',
    },
    {
      label: 'Jurnal Siswa',
      path: '/kurikulum/jurnal-siswa',
      icon: NotebookPen,
      permission: 'student.journal.monitor',
    },
    { label: 'Laporan', path: '/kurikulum/laporan', icon: FileBarChart2, permission: 'report.view' },
    { label: 'Validasi Data', path: '/kurikulum/validasi', icon: FileCheck2, permission: 'validation.manage' },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: ShieldCheck, permission: 'admin.dashboard.view' },
    { label: 'Data Master', path: '/admin/data-master', icon: Database, permission: 'master.data.manage' },
  ],
};
