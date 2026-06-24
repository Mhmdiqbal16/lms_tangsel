import {
  AdminProfile,
  AppDataState,
  AssessmentRecord,
  AssessmentQuestion,
  ClassRoom,
  CurriculumProfile,
  LearningMaterial,
  MockData,
  NotificationItem,
  Schedule,
  StudentAttendance,
  StudentJournal,
  StudentProfile,
  Subject,
  TeacherAttendance,
  TeacherProfile,
  TeacherQuestionnaire,
  User,
} from '@/types';
import { getAcademicToday, getNextSchoolDay, getRecentSchoolDates, toISODate } from '@/utils/date';

const academicToday = getAcademicToday();
const recentSchoolDates = getRecentSchoolDates(5, academicToday);
const [todayDate, oneDayAgoDate, twoDaysAgoDate, threeDaysAgoDate, fourDaysAgoDate] = recentSchoolDates;
const todayISO = toISODate(todayDate);
const oneDayAgoISO = toISODate(oneDayAgoDate);
const twoDaysAgoISO = toISODate(twoDaysAgoDate);
const threeDaysAgoISO = toISODate(threeDaysAgoDate);
const fourDaysAgoISO = toISODate(fourDaysAgoDate);
const nextSchoolDate = getNextSchoolDay(todayDate);

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

export const students: StudentProfile[] = [
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

export const teachers: TeacherProfile[] = [
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

export const curricula: CurriculumProfile[] = [
  {
    id: 'kur-1',
    userId: 'user-kurikulum-1',
    name: 'Rina Wulandari, M.Pd.',
    nip: '197905182010012003',
    employeeId: 'KUR-2026-01',
    email: 'rina.wulandari@smkn2.sch.id',
  },
];

export const admins: AdminProfile[] = [
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

function buildQuestions(prefix: string, count: number): AssessmentQuestion[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    question: `${prefix} soal nomor ${index + 1}`,
    options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
    answer: 'Pilihan A',
  }));
}

function getSchedulesByClassAndDay(classId: string, day: number) {
  return schedules
    .filter((item) => item.classId === classId && item.day === day)
    .sort((first, second) => first.startTime.localeCompare(second.startTime));
}

function requireSchedule(classId: string, date: Date, index = 0) {
  const match = getSchedulesByClassAndDay(classId, date.getDay())[index];
  if (!match) {
    throw new Error(`Mock schedule tidak ditemukan untuk ${classId} pada hari ${date.getDay()}`);
  }
  return match;
}

function findRecentTeacherSchedule(classId: string, teacherId: string) {
  for (const date of recentSchoolDates) {
    const match = schedules.find(
      (item) => item.classId === classId && item.teacherId === teacherId && item.day === date.getDay(),
    );
    if (match) {
      return {
        date: toISODate(date),
        schedule: match,
      };
    }
  }

  throw new Error(`Tidak ada jadwal terbaru untuk ${teacherId} di ${classId}`);
}

const class1TodayPrimary = requireSchedule('cls-xirpl1', todayDate, 0);
const class1TodaySecondary = requireSchedule('cls-xirpl1', todayDate, 1);
const class1OneDayPrimary = requireSchedule('cls-xirpl1', oneDayAgoDate, 0);
const class1TwoDaysPrimary = requireSchedule('cls-xirpl1', twoDaysAgoDate, 0);
const class1ThreeDaysPrimary = requireSchedule('cls-xirpl1', threeDaysAgoDate, 0);
const class1FourDaysPrimary = requireSchedule('cls-xirpl1', fourDaysAgoDate, 0);
const class2RecentTeaching = findRecentTeacherSchedule('cls-xirpl2', 't-1');

export const studentAttendances: StudentAttendance[] = [
  {
    id: 'att-s1-1',
    studentId: 'std-1',
    scheduleId: class1FourDaysPrimary.id,
    date: fourDaysAgoISO,
    status: 'Hadir',
  },
  {
    id: 'att-s1-2',
    studentId: 'std-1',
    scheduleId: requireSchedule('cls-xirpl1', fourDaysAgoDate, 1).id,
    date: fourDaysAgoISO,
    status: 'Izin',
  },
  {
    id: 'att-s1-3',
    studentId: 'std-1',
    scheduleId: class1ThreeDaysPrimary.id,
    date: threeDaysAgoISO,
    status: 'Hadir',
  },
  {
    id: 'att-s1-4',
    studentId: 'std-1',
    scheduleId: class1TwoDaysPrimary.id,
    date: twoDaysAgoISO,
    status: 'Hadir',
  },
  {
    id: 'att-s1-5',
    studentId: 'std-1',
    scheduleId: class1OneDayPrimary.id,
    date: oneDayAgoISO,
    status: 'Hadir',
  },
  {
    id: 'att-s1-6',
    studentId: 'std-1',
    scheduleId: class1TodayPrimary.id,
    date: todayISO,
    status: 'Hadir',
  },
  {
    id: 'att-s2-1',
    studentId: 'std-2',
    scheduleId: class1OneDayPrimary.id,
    date: oneDayAgoISO,
    status: 'Hadir',
  },
  {
    id: 'att-s2-2',
    studentId: 'std-2',
    scheduleId: class1TodayPrimary.id,
    date: todayISO,
    status: 'Hadir',
  },
  {
    id: 'att-s3-1',
    studentId: 'std-3',
    scheduleId: class1TodayPrimary.id,
    date: todayISO,
    status: 'Alfa',
  },
  {
    id: 'att-s4-1',
    studentId: 'std-4',
    scheduleId: class2RecentTeaching.schedule.id,
    date: class2RecentTeaching.date,
    status: 'Hadir',
  },
];

export const teacherAttendances: TeacherAttendance[] = [
  {
    id: 'pres-t1-1',
    teacherId: 't-1',
    scheduleId: class1FourDaysPrimary.id,
    date: fourDaysAgoISO,
    status: 'Hadir',
    notes: 'Pembelajaran berjalan sesuai modul minggu ke-4.',
  },
  {
    id: 'pres-t1-2',
    teacherId: 't-1',
    scheduleId: class1ThreeDaysPrimary.id,
    date: threeDaysAgoISO,
    status: 'Hadir',
    notes: 'Diskusi coding dan latihan mandiri.',
  },
  {
    id: 'pres-t1-3',
    teacherId: 't-1',
    scheduleId: class1TwoDaysPrimary.id,
    date: twoDaysAgoISO,
    status: 'Hadir',
    notes: 'Siswa melakukan review struktur data tabel.',
  },
  {
    id: 'pres-t1-4',
    teacherId: 't-1',
    scheduleId: class1OneDayPrimary.id,
    date: oneDayAgoISO,
    status: 'Hadir',
    notes: 'Pertemuan fokus pada normalisasi database.',
  },
  {
    id: 'pres-t1-5',
    teacherId: 't-1',
    scheduleId: class1TodayPrimary.id,
    date: todayISO,
    status: 'Hadir',
    notes: 'Praktik membuat class dan object di TypeScript.',
  },
  {
    id: 'pres-t4-1',
    teacherId: 't-4',
    scheduleId: class1TodaySecondary.id,
    date: todayISO,
    status: 'Hadir',
    notes: 'Latihan presentasi hasil observasi.',
  },
  {
    id: 'pres-t2-1',
    teacherId: 't-2',
    scheduleId: requireSchedule('cls-xirpl1', oneDayAgoDate, 1).id,
    date: oneDayAgoISO,
    status: 'Izin',
    notes: 'Izin mengikuti pelatihan MGMP.',
  },
  {
    id: 'pres-t3-1',
    teacherId: 't-3',
    scheduleId: requireSchedule('cls-xirpl1', twoDaysAgoDate, 1).id,
    date: twoDaysAgoISO,
    status: 'Hadir',
    notes: 'Praktik topologi jaringan star dan bus.',
  },
  {
    id: 'pres-t1-6',
    teacherId: 't-1',
    scheduleId: class2RecentTeaching.schedule.id,
    date: class2RecentTeaching.date,
    status: 'Hadir',
    notes: 'Pendampingan pembuatan project mini kelas XI RPL 2.',
  },
];

export const learningMaterials: LearningMaterial[] = [
  {
    id: 'mat-1',
    teacherId: 't-1',
    scheduleId: class1ThreeDaysPrimary.id,
    date: threeDaysAgoISO,
    meeting: 5,
    title: 'Pengenalan Encapsulation pada Class',
    description: 'Guru menjelaskan konsep encapsulation dan modifier private/public.',
    validationStatus: 'Valid',
    alignmentStatus: 'Sesuai',
  },
  {
    id: 'mat-2',
    teacherId: 't-1',
    scheduleId: class1TwoDaysPrimary.id,
    date: twoDaysAgoISO,
    meeting: 6,
    title: 'Review Struktur Data dan Relationship Table',
    description: 'Siswa memetakan relasi one to many dan many to many.',
    validationStatus: 'Menunggu',
    alignmentStatus: 'Sesuai',
  },
  {
    id: 'mat-3',
    teacherId: 't-1',
    scheduleId: class1OneDayPrimary.id,
    date: oneDayAgoISO,
    meeting: 7,
    title: 'Normalisasi 1NF sampai 3NF',
    description: 'Materi dilanjutkan dengan studi kasus rancangan tabel akademik.',
    validationStatus: 'Menunggu',
    alignmentStatus: 'Sesuai',
  },
  {
    id: 'mat-4',
    teacherId: 't-1',
    scheduleId: class1TodayPrimary.id,
    date: todayISO,
    meeting: 8,
    title: 'Membangun Class dan Object',
    description: 'Guru memberikan contoh implementasi class, object, dan constructor.',
    validationStatus: 'Menunggu',
    alignmentStatus: 'Sesuai',
  },
  {
    id: 'mat-5',
    teacherId: 't-4',
    scheduleId: class1TodaySecondary.id,
    date: todayISO,
    meeting: 8,
    title: 'Presentasi Laporan Hasil Observasi',
    description: 'Siswa berlatih presentasi kelompok, namun dokumen pendukung belum lengkap.',
    validationStatus: 'Ditolak',
    alignmentStatus: 'Perlu Cek',
  },
  {
    id: 'mat-6',
    teacherId: class2RecentTeaching.schedule.teacherId,
    scheduleId: class2RecentTeaching.schedule.id,
    date: class2RecentTeaching.date,
    meeting: 6,
    title: 'Refactor OOP Project Sederhana',
    description: 'Fokus pada pengelompokan method dan penggunaan object secara konsisten.',
    validationStatus: 'Valid',
    alignmentStatus: 'Sesuai',
  },
];

export const assessments: AssessmentRecord[] = [
  {
    id: 'asm-pre-1',
    type: 'pretest',
    teacherId: 't-1',
    scheduleId: class1OneDayPrimary.id,
    classId: 'cls-xirpl1',
    subjectId: class1OneDayPrimary.subjectId,
    date: oneDayAgoISO,
    meeting: 7,
    questionCount: 5,
    status: 'Aktif',
    questions: buildQuestions('Pretest Basis Data', 5),
    studentStatuses: [
      { studentId: 'std-1', completed: true },
      { studentId: 'std-2', completed: true },
      { studentId: 'std-3', completed: false },
    ],
  },
  {
    id: 'asm-post-1',
    type: 'posttest',
    teacherId: 't-1',
    scheduleId: class1OneDayPrimary.id,
    classId: 'cls-xirpl1',
    subjectId: class1OneDayPrimary.subjectId,
    date: oneDayAgoISO,
    meeting: 7,
    questionCount: 5,
    status: 'Aktif',
    questions: buildQuestions('Posttest Basis Data', 5),
    studentStatuses: [
      { studentId: 'std-1', completed: true },
      { studentId: 'std-2', completed: true },
      { studentId: 'std-3', completed: false },
    ],
  },
  {
    id: 'asm-pre-2',
    type: 'pretest',
    teacherId: 't-1',
    scheduleId: class1TodayPrimary.id,
    classId: 'cls-xirpl1',
    subjectId: class1TodayPrimary.subjectId,
    date: todayISO,
    meeting: 8,
    questionCount: 5,
    status: 'Aktif',
    questions: buildQuestions('Pretest PBO', 5),
    studentStatuses: [
      { studentId: 'std-1', completed: true },
      { studentId: 'std-2', completed: true },
      { studentId: 'std-3', completed: false },
    ],
  },
  {
    id: 'asm-post-2',
    type: 'posttest',
    teacherId: 't-1',
    scheduleId: class1TodayPrimary.id,
    classId: 'cls-xirpl1',
    subjectId: class1TodayPrimary.subjectId,
    date: todayISO,
    meeting: 8,
    questionCount: 5,
    status: 'Aktif',
    questions: buildQuestions('Posttest PBO', 5),
    studentStatuses: [
      { studentId: 'std-1', completed: false },
      { studentId: 'std-2', completed: true },
      { studentId: 'std-3', completed: false },
    ],
  },
  {
    id: 'asm-pre-3',
    type: 'pretest',
    teacherId: 't-1',
    scheduleId: class1TwoDaysPrimary.id,
    classId: 'cls-xirpl1',
    subjectId: class1TwoDaysPrimary.subjectId,
    date: twoDaysAgoISO,
    meeting: 6,
    questionCount: 4,
    status: 'Aktif',
    questions: buildQuestions('Pretest Rabu', 4),
    studentStatuses: [
      { studentId: 'std-1', completed: true },
      { studentId: 'std-2', completed: true },
      { studentId: 'std-3', completed: true },
    ],
  },
  {
    id: 'asm-post-3',
    type: 'posttest',
    teacherId: 't-1',
    scheduleId: class1TwoDaysPrimary.id,
    classId: 'cls-xirpl1',
    subjectId: class1TwoDaysPrimary.subjectId,
    date: twoDaysAgoISO,
    meeting: 6,
    questionCount: 4,
    status: 'Aktif',
    questions: buildQuestions('Posttest Rabu', 4),
    studentStatuses: [
      { studentId: 'std-1', completed: false },
      { studentId: 'std-2', completed: true },
      { studentId: 'std-3', completed: true },
    ],
  },
];

export const questionnaires: TeacherQuestionnaire[] = [
  {
    id: 'kui-1',
    studentId: 'std-1',
    teacherId: 't-1',
    scheduleId: class1OneDayPrimary.id,
    date: oneDayAgoISO,
    completed: true,
    ratings: { clarity: 5, interaction: 4, discipline: 5, support: 4 },
    note: 'Guru menjelaskan materi dengan jelas dan memberi kesempatan bertanya.',
  },
  {
    id: 'kui-2',
    studentId: 'std-1',
    teacherId: 't-1',
    scheduleId: class1TodayPrimary.id,
    date: todayISO,
    completed: false,
    ratings: {},
    note: '',
  },
  {
    id: 'kui-3',
    studentId: 'std-2',
    teacherId: 't-1',
    scheduleId: class1TodayPrimary.id,
    date: todayISO,
    completed: true,
    ratings: { clarity: 4, interaction: 4, discipline: 5, support: 5 },
    note: 'Pembelajaran berjalan baik dan guru membantu saat latihan.',
  },
  {
    id: 'kui-4',
    studentId: 'std-1',
    teacherId: 't-1',
    scheduleId: class1TwoDaysPrimary.id,
    date: twoDaysAgoISO,
    completed: true,
    ratings: { clarity: 4, interaction: 5, discipline: 4, support: 4 },
    note: 'Diskusi kelas membantu memahami materi.',
  },
];

export const studentJournals: StudentJournal[] = [
  {
    id: 'jur-1',
    studentId: 'std-1',
    scheduleId: class1ThreeDaysPrimary.id,
    date: threeDaysAgoISO,
    materialStudied: 'Pengenalan Encapsulation pada Class',
    summary: 'Mempelajari cara menyembunyikan data dalam class dengan access modifier.',
    tasks: 'Membuat class Student dengan properti private dan method getter.',
    learningObstacles: 'Masih perlu latihan memahami kapan menggunakan private.',
    attachmentName: 'encapsulation-note.pdf',
    entryStatus: 'Selesai',
    reviewStatus: 'Tervalidasi',
    notes: 'Ringkasan sudah sesuai dengan materi guru.',
    validationStatus: 'Valid',
  },
  {
    id: 'jur-2',
    studentId: 'std-2',
    scheduleId: class1OneDayPrimary.id,
    date: oneDayAgoISO,
    materialStudied: 'Normalisasi 1NF sampai 3NF',
    summary: 'Menjabarkan proses memecah tabel agar tidak terjadi redundansi data.',
    tasks: 'Menyusun normalisasi tabel perpustakaan hingga 3NF.',
    learningObstacles: 'Masih perlu membedakan antara dependensi parsial dan transitif.',
    attachmentName: 'normalisasi-xirpl1.docx',
    entryStatus: 'Selesai',
    reviewStatus: 'Menunggu Review',
    notes: 'Menunggu validasi guru dan kurikulum.',
    validationStatus: 'Menunggu',
  },
  {
    id: 'jur-3',
    studentId: 'std-3',
    scheduleId: class1TodayPrimary.id,
    date: todayISO,
    materialStudied: 'Membangun Class dan Object',
    summary: 'Memahami constructor, property, dan method pada class sederhana.',
    tasks: 'Membuat class Produk dan menginstansiasi object.',
    learningObstacles: 'Belum konsisten membedakan method dan property.',
    attachmentName: 'class-object-nabila.pdf',
    entryStatus: 'Selesai',
    reviewStatus: 'Belum Ditinjau',
    notes: 'Belum ditinjau guru.',
    validationStatus: 'Menunggu',
  },
  {
    id: 'jur-4',
    studentId: 'std-4',
    scheduleId: class2RecentTeaching.schedule.id,
    date: class2RecentTeaching.date,
    materialStudied: 'Refactor OOP Project Sederhana',
    summary: 'Merapikan struktur method dan memisahkan logika per object.',
    tasks: 'Refactor mini project inventaris kelas.',
    learningObstacles: 'Masih kesulitan menjaga konsistensi penamaan method.',
    attachmentName: 'oop-project-rpl2.pdf',
    entryStatus: 'Selesai',
    reviewStatus: 'Tervalidasi',
    notes: 'Isi jurnal sudah sinkron dengan materi guru.',
    validationStatus: 'Valid',
  },
];

export const notifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Batas jurnal hari ini',
    description: 'Jurnal untuk pelajaran kemarin masih bisa diisi sampai pukul 23.59 hari ini.',
    type: 'warning',
    date: todayISO,
    role: 'siswa',
  },
  {
    id: 'notif-2',
    title: 'Materi minggu ini',
    description: 'Guru diminta melengkapi catatan pembelajaran setiap selesai mengajar.',
    type: 'info',
    date: todayISO,
    role: 'guru',
  },
  {
    id: 'notif-3',
    title: 'Validasi data',
    description: 'Ada materi dan jurnal baru yang menunggu validasi kurikulum.',
    type: 'info',
    date: todayISO,
    role: 'kurikulum',
  },
  {
    id: 'notif-4',
    title: 'Monitoring sistem',
    description: 'Ringkasan sistem diperbarui otomatis dari data frontend mock.',
    type: 'success',
    date: todayISO,
    role: 'admin',
  },
  {
    id: 'notif-5',
    title: 'Agenda berikutnya',
    description: `Pertemuan berikutnya dijadwalkan pada ${toISODate(nextSchoolDate)} untuk simulasi lanjutan.`,
    type: 'info',
    date: todayISO,
    role: 'all',
  },
];

const reportSummary = {
  totalTeachers: teachers.length,
  totalStudents: students.length,
  totalClasses: classes.length,
  totalSubjects: subjects.length,
  totalJournals: studentJournals.length,
  totalTeacherAttendances: teacherAttendances.length,
};

export const demoAccounts = [
  { role: 'admin' as const, identifier: '000000000000000000', password: 'admin12345', label: 'Admin Setup' },
];

export const mockData: MockData = {
  users,
  students,
  teachers,
  curricula,
  admins,
  classes,
  subjects,
  schedules,
  studentAttendances: [...studentAttendances],
  teacherAttendances: [...teacherAttendances],
  learningMaterials: [...learningMaterials],
  assessments: [...assessments],
  questionnaires: [...questionnaires],
  studentJournals: [...studentJournals],
  notifications,
  reportSummary,
};

export const initialAppDataState: AppDataState = {
  users: [],
  students: [],
  teachers: [],
  curricula: [],
  admins: [],
  classes: [],
  subjects: [],
  schedules: [],
  studentAttendances: [],
  teacherAttendances: [],
  learningMaterials: [],
  assessments: [],
  questionnaires: [],
  studentJournals: [],
};

export const academicDateReference = todayISO;
