import { Permission, Role } from '@/types';

export const permissionsByRole: Record<Role, Permission[]> = {
  siswa: [
    'dashboard.view',
    'student.attendance.view',
    'schedule.view',
    'student.journal.create',
    'student.journal.view_history',
    'account.view_own',
  ],
  guru: [
    'dashboard.view',
    'teacher.attendance.view_own',
    'teacher.attendance.create',
    'student.attendance.manage_taught_classes',
    'learning.material.create',
    'student.journal.view_taught_classes',
    'assessment.manage',
    'assessment.result.view_taught_classes',
    'teaching.history.view_own',
    'account.view_own',
  ],
  kurikulum: [
    'dashboard.monitor',
    'teacher.attendance.monitor',
    'learning.material.monitor',
    'student.journal.monitor',
    'questionnaire.result.view',
    'report.view',
    'validation.manage',
    'account.view_own',
  ],
  admin: ['admin.dashboard.view', 'master.data.manage'],
};

const accessHighlightsByRole: Record<Role, string[]> = {
  siswa: ['Melihat dashboard, jadwal, dan absensi pribadi.'],
  guru: ['Mengisi presensi mengajar sesuai jadwal dan akun guru yang aktif.'],
  kurikulum: ['Memantau dashboard monitoring, kehadiran guru, jurnal siswa, dan hasil kuisioner lintas kelas.'],
  admin: ['Melihat dashboard Super Admin dan mengelola data master sistem.'],
};

export function hasPermissionForRole(role: Role, permission: Permission) {
  return permissionsByRole[role].includes(permission);
}

export function getPermissionsForRole(role: Role) {
  return permissionsByRole[role];
}

export function getRoleAccessHighlights(role: Role) {
  return accessHighlightsByRole[role];
}
