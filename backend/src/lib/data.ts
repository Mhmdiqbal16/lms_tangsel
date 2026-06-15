import type {
  Admin,
  AssessmentRecord,
  ClassRoom,
  Curriculum,
  LearningMaterial,
  Schedule,
  Student,
  StudentAttendance,
  StudentJournal,
  Subject,
  Teacher,
  TeacherAttendance,
  TeacherQuestionnaire,
  User,
} from '@/types/domain';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  const next = startOfDay(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function parseISODate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getAcademicToday(reference = new Date()) {
  let cursor = startOfDay(reference);
  while (cursor.getDay() === 0 || cursor.getDay() === 6) {
    cursor = addDays(cursor, -1);
  }
  return cursor;
}

export function getTodayDate() {
  return toISODate(getAcademicToday());
}

export function getDateOrAcademicToday(date?: string | null) {
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : getTodayDate();
}

export const users: User[] = [
  {
    id: 'user-siswa-1',
    role: 'siswa',
    identifier: '0067458123',
    password: 'alya2026',
    name: 'Alya Putri Ramadhani',
    referenceId: 'std-1',
  },
  {
    id: 'user-guru-1',
    role: 'guru',
    identifier: '198906122018011001',
    password: 'budi2026',
    name: 'Budi Santoso, S.Kom.',
    referenceId: 't-1',
  },
  {
    id: 'user-kurikulum-1',
    role: 'kurikulum',
    identifier: '197905182010012003',
    password: 'rina2026',
    name: 'Rina Wulandari, M.Pd.',
    referenceId: 'kur-1',
  },
  {
    id: 'user-admin-1',
    role: 'admin',
    identifier: '197912102009011001',
    password: 'admin2026',
    name: 'Admin Sekolah',
    referenceId: 'adm-1',
  },
];

export const students: Student[] = [
  {
    id: 'std-1',
    userId: 'user-siswa-1',
    name: 'Alya Putri Ramadhani',
    nisn: '0067458123',
    classId: 'cls-xirpl1',
    email: 'alya@smkn2.sch.id',
    avatar: 'AP',
  },
  {
    id: 'std-2',
    name: 'Dimas Pratama',
    nisn: '0067458124',
    classId: 'cls-xirpl1',
    email: 'dimas@smkn2.sch.id',
    avatar: 'DP',
  },
  {
    id: 'std-3',
    name: 'Nabila Salsabila',
    nisn: '0067458125',
    classId: 'cls-xirpl1',
    email: 'nabila@smkn2.sch.id',
    avatar: 'NS',
  },
  {
    id: 'std-4',
    name: 'Farhan Akbar',
    nisn: '0067458126',
    classId: 'cls-xirpl2',
    email: 'farhan@smkn2.sch.id',
    avatar: 'FA',
  },
  {
    id: 'std-5',
    name: 'Siti Nuraini',
    nisn: '0067458127',
    classId: 'cls-xirpl2',
    email: 'siti@smkn2.sch.id',
    avatar: 'SN',
  },
  {
    id: 'std-6',
    name: 'Raka Maulana',
    nisn: '0067458128',
    classId: 'cls-xirpl2',
    email: 'raka@smkn2.sch.id',
    avatar: 'RM',
  },
];

export const teachers: Teacher[] = [
  {
    id: 't-1',
    userId: 'user-guru-1',
    name: 'Budi Santoso, S.Kom.',
    nip: '198906122018011001',
    subjectIds: ['sub-bd', 'sub-pbo'],
    email: 'budi.santoso@smkn2.sch.id',
  },
  {
    id: 't-2',
    name: 'Anita Rahmawati, S.Pd.',
    nip: '198802142017022004',
    subjectIds: ['sub-mtk'],
    email: 'anita.rahmawati@smkn2.sch.id',
  },
  {
    id: 't-3',
    name: 'Dedi Saputra, S.Kom.',
    nip: '198704102016031005',
    subjectIds: ['sub-jardas'],
    email: 'dedi.saputra@smkn2.sch.id',
  },
  {
    id: 't-4',
    name: 'Lilis Wahyuni, S.Pd.',
    nip: '198511202014012002',
    subjectIds: ['sub-bind'],
    email: 'lilis.wahyuni@smkn2.sch.id',
  },
];

export const curricula: Curriculum[] = [
  {
    id: 'kur-1',
    userId: 'user-kurikulum-1',
    name: 'Rina Wulandari, M.Pd.',
    nip: '197905182010012003',
    employeeId: 'KUR-2026-01',
    email: 'rina.wulandari@smkn2.sch.id',
  },
];

export const admins: Admin[] = [
  {
    id: 'adm-1',
    userId: 'user-admin-1',
    name: 'Admin Sekolah',
    nip: '197912102009011001',
    email: 'admin@smkn2.sch.id',
  },
];

export const classes: ClassRoom[] = [
  {
    id: 'cls-xirpl1',
    name: 'XI RPL 1',
    major: 'Rekayasa Perangkat Lunak',
    homeroomTeacherId: 't-1',
  },
  {
    id: 'cls-xirpl2',
    name: 'XI RPL 2',
    major: 'Rekayasa Perangkat Lunak',
    homeroomTeacherId: 't-3',
  },
];

export const subjects: Subject[] = [
  { id: 'sub-bd', name: 'Basis Data', shortName: 'BD' },
  { id: 'sub-pbo', name: 'Pemrograman Berorientasi Objek', shortName: 'PBO' },
  { id: 'sub-jardas', name: 'Jaringan Dasar', shortName: 'Jardas' },
  { id: 'sub-mtk', name: 'Matematika', shortName: 'MTK' },
  { id: 'sub-bind', name: 'Bahasa Indonesia', shortName: 'B. Indo' },
];

export const schedules: Schedule[] = [
  {
    id: 'sch-rpl1-mon-bd',
    classId: 'cls-xirpl1',
    subjectId: 'sub-bd',
    teacherId: 't-1',
    day: 1,
    startTime: '07:00',
    endTime: '08:40',
    room: 'Lab RPL 1',
  },
  {
    id: 'sch-rpl1-mon-mtk',
    classId: 'cls-xirpl1',
    subjectId: 'sub-mtk',
    teacherId: 't-2',
    day: 1,
    startTime: '09:00',
    endTime: '10:40',
    room: 'Ruang XI RPL 1',
  },
  {
    id: 'sch-rpl1-tue-pbo',
    classId: 'cls-xirpl1',
    subjectId: 'sub-pbo',
    teacherId: 't-1',
    day: 2,
    startTime: '07:00',
    endTime: '08:40',
    room: 'Lab RPL 1',
  },
  {
    id: 'sch-rpl1-tue-bind',
    classId: 'cls-xirpl1',
    subjectId: 'sub-bind',
    teacherId: 't-4',
    day: 2,
    startTime: '09:00',
    endTime: '10:40',
    room: 'Ruang XI RPL 1',
  },
  {
    id: 'sch-rpl1-wed-bd',
    classId: 'cls-xirpl1',
    subjectId: 'sub-bd',
    teacherId: 't-1',
    day: 3,
    startTime: '07:00',
    endTime: '08:40',
    room: 'Lab Basis Data',
  },
  {
    id: 'sch-rpl1-wed-jardas',
    classId: 'cls-xirpl1',
    subjectId: 'sub-jardas',
    teacherId: 't-3',
    day: 3,
    startTime: '09:00',
    endTime: '10:40',
    room: 'Lab Jaringan',
  },
  {
    id: 'sch-rpl1-thu-bd',
    classId: 'cls-xirpl1',
    subjectId: 'sub-bd',
    teacherId: 't-1',
    day: 4,
    startTime: '07:00',
    endTime: '08:40',
    room: 'Lab Basis Data',
  },
  {
    id: 'sch-rpl1-thu-mtk',
    classId: 'cls-xirpl1',
    subjectId: 'sub-mtk',
    teacherId: 't-2',
    day: 4,
    startTime: '09:00',
    endTime: '10:40',
    room: 'Ruang XI RPL 1',
  },
  {
    id: 'sch-rpl1-fri-pbo',
    classId: 'cls-xirpl1',
    subjectId: 'sub-pbo',
    teacherId: 't-1',
    day: 5,
    startTime: '07:00',
    endTime: '08:40',
    room: 'Lab RPL 1',
  },
  {
    id: 'sch-rpl1-fri-bind',
    classId: 'cls-xirpl1',
    subjectId: 'sub-bind',
    teacherId: 't-4',
    day: 5,
    startTime: '09:00',
    endTime: '10:40',
    room: 'Ruang XI RPL 1',
  },
  {
    id: 'sch-rpl2-mon-pbo',
    classId: 'cls-xirpl2',
    subjectId: 'sub-pbo',
    teacherId: 't-1',
    day: 1,
    startTime: '10:50',
    endTime: '12:30',
    room: 'Lab RPL 2',
  },
  {
    id: 'sch-rpl2-tue-mtk',
    classId: 'cls-xirpl2',
    subjectId: 'sub-mtk',
    teacherId: 't-2',
    day: 2,
    startTime: '10:50',
    endTime: '12:30',
    room: 'Ruang XI RPL 2',
  },
  {
    id: 'sch-rpl2-wed-bd',
    classId: 'cls-xirpl2',
    subjectId: 'sub-bd',
    teacherId: 't-1',
    day: 3,
    startTime: '10:50',
    endTime: '12:30',
    room: 'Lab Basis Data',
  },
  {
    id: 'sch-rpl2-thu-jardas',
    classId: 'cls-xirpl2',
    subjectId: 'sub-jardas',
    teacherId: 't-3',
    day: 4,
    startTime: '10:50',
    endTime: '12:30',
    room: 'Lab Jaringan',
  },
  {
    id: 'sch-rpl2-fri-pbo',
    classId: 'cls-xirpl2',
    subjectId: 'sub-pbo',
    teacherId: 't-1',
    day: 5,
    startTime: '10:50',
    endTime: '12:30',
    room: 'Lab RPL 2',
  },
];

export const teacherAttendances: TeacherAttendance[] = [];

export const studentAttendances: StudentAttendance[] = [];

export const learningMaterials: LearningMaterial[] = [];

export const assessments: AssessmentRecord[] = [];

export const questionnaires: TeacherQuestionnaire[] = [];

export const studentJournals: StudentJournal[] = [];

export function getUserProfile(user: User) {
  if (user.role === 'siswa') {
    return students.find((student) => student.id === user.referenceId) ?? null;
  }

  if (user.role === 'guru') {
    return teachers.find((teacher) => teacher.id === user.referenceId) ?? null;
  }

  if (user.role === 'kurikulum') {
    return curricula.find((curriculum) => curriculum.id === user.referenceId) ?? null;
  }

  return admins.find((admin) => admin.id === user.referenceId) ?? null;
}

export function getAuthSession(user: User) {
  return {
    userId: user.id,
    role: user.role,
    name: user.name,
    identifier: user.identifier,
    referenceId: user.referenceId,
  };
}

export function getScheduleView(schedule: Schedule) {
  const classRoom = classes.find((classItem) => classItem.id === schedule.classId) ?? null;

  return {
    ...schedule,
    teacher: teachers.find((teacher) => teacher.id === schedule.teacherId) ?? null,
    classRoom,
    classroom: classRoom,
    subject: subjects.find((subject) => subject.id === schedule.subjectId) ?? null,
  };
}
