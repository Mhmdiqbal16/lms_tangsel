import { initialAppDataState } from '@/data/mockData';
import { AppDataState } from '@/types';

export const APP_DATA_STORAGE_KEY = 'monitoring-pembelajaran-data-v3-empty-admin';

const APP_DATA_RESET_MARKER_KEY = 'monitoring-pembelajaran-data-reset-version';
const APP_DATA_RESET_VERSION = 'manual-empty-2026-05-02';
const LEGACY_APP_DATA_STORAGE_KEYS = [
  'monitoring-pembelajaran-data-v1',
  'monitoring-pembelajaran-data-v2-manual',
];

function arrayOrDefault<T>(value: unknown, fallback: T[]) {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

export function normalizeAppState(value: Partial<AppDataState> | null | undefined): AppDataState {
  return {
    ...initialAppDataState,
    users: arrayOrDefault(value?.users, initialAppDataState.users),
    students: arrayOrDefault(value?.students, initialAppDataState.students),
    teachers: arrayOrDefault(value?.teachers, initialAppDataState.teachers),
    curricula: arrayOrDefault(value?.curricula, initialAppDataState.curricula),
    admins: arrayOrDefault(value?.admins, initialAppDataState.admins),
    classes: arrayOrDefault(value?.classes, initialAppDataState.classes),
    subjects: arrayOrDefault(value?.subjects, initialAppDataState.subjects),
    schedules: arrayOrDefault(value?.schedules, initialAppDataState.schedules),
    studentAttendances: arrayOrDefault(value?.studentAttendances, initialAppDataState.studentAttendances),
    teacherAttendances: arrayOrDefault(value?.teacherAttendances, initialAppDataState.teacherAttendances),
    learningMaterials: arrayOrDefault(value?.learningMaterials, initialAppDataState.learningMaterials),
    assessments: arrayOrDefault(value?.assessments, initialAppDataState.assessments),
    questionnaires: arrayOrDefault(value?.questionnaires, initialAppDataState.questionnaires),
    studentJournals: arrayOrDefault(value?.studentJournals, initialAppDataState.studentJournals),
  };
}

export function readStoredAppState() {
  if (typeof window === 'undefined') {
    return initialAppDataState;
  }

  try {
    if (ensureManualDataReset()) {
      return initialAppDataState;
    }

    const raw = window.localStorage.getItem(APP_DATA_STORAGE_KEY);
    if (!raw) {
      return initialAppDataState;
    }

    return normalizeAppState(JSON.parse(raw) as Partial<AppDataState>);
  } catch {
    return initialAppDataState;
  }
}

export function ensureManualDataReset() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.localStorage.getItem(APP_DATA_RESET_MARKER_KEY) === APP_DATA_RESET_VERSION) {
    return false;
  }

  [...LEGACY_APP_DATA_STORAGE_KEYS, APP_DATA_STORAGE_KEY].forEach((key) => {
    window.localStorage.removeItem(key);
  });
  window.localStorage.setItem(APP_DATA_RESET_MARKER_KEY, APP_DATA_RESET_VERSION);

  return true;
}
