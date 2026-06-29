import { Role } from '@/types';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function getRoleLabel(role: Role) {
  return {
    siswa: 'Siswa',
    guru: 'Guru',
    kurikulum: 'Kurikulum',
    admin: 'Super Admin',
  }[role];
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
