export type UserRole = 'admin' | 'guru' | 'kurikulum' | 'siswa';

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Alfa';

export type TeacherAttendanceStatus = 'Hadir' | 'Izin' | 'Belum Presensi';

export type ValidationStatus = 'Menunggu' | 'Valid' | 'Ditolak';

export type AlignmentStatus = 'Sesuai' | 'Belum Diisi' | 'Perlu Cek';

export type AssessmentType = 'pretest' | 'posttest';

export type ActiveStatus = 'Aktif' | 'Nonaktif';

export type User = {
  id: string;
  role: UserRole;
  identifier: string;
  password: string;
  name: string;
  referenceId: string;
};

export type Student = {
  id: string;
  userId?: string;
  name: string;
  nisn: string;
  classId: string;
  email: string;
  avatar: string;
};

export type Teacher = {
  id: string;
  userId?: string;
  name: string;
  nip: string;
  subjectIds: string[];
  email: string;
};

export type Curriculum = {
  id: string;
  userId?: string;
  name: string;
  nip: string;
  employeeId: string;
  email: string;
};

export type Admin = {
  id: string;
  userId?: string;
  name: string;
  nip: string;
  email: string;
};

export type ClassRoom = {
  id: string;
  name: string;
  major: string;
  homeroomTeacherId: string;
};

export type Subject = {
  id: string;
  name: string;
  shortName: string;
};

export type Schedule = {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  day: number;
  startTime: string;
  endTime: string;
  room: string;
};

export type TeacherAttendance = {
  id: string;
  teacherId: string;
  scheduleId: string;
  date: string;
  status: TeacherAttendanceStatus;
  notes: string;
};

export type StudentAttendance = {
  id: string;
  studentId: string;
  scheduleId: string;
  date: string;
  status: AttendanceStatus;
};

export type LearningMaterial = {
  id: string;
  teacherId: string;
  scheduleId: string;
  date: string;
  meeting: number;
  title: string;
  description: string;
  validationStatus: ValidationStatus;
  alignmentStatus: AlignmentStatus;
};

export type AssessmentQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: string;
};

export type AssessmentStudentAnswer = {
  questionId: string;
  answer: string;
  correct: boolean;
};

export type AssessmentRecord = {
  id: string;
  type: AssessmentType;
  teacherId: string;
  scheduleId: string;
  classId: string;
  subjectId: string;
  date: string;
  meeting: number;
  questionCount: number;
  status: ActiveStatus;
  questions: AssessmentQuestion[];
  studentStatuses: Array<{
    studentId: string;
    completed: boolean;
    completedAt?: string;
    score?: number;
    answers?: AssessmentStudentAnswer[];
  }>;
};

export type TeacherQuestionnaire = {
  id: string;
  studentId: string;
  teacherId: string;
  scheduleId: string;
  date: string;
  completed: boolean;
};

export type StudentJournal = {
  id: string;
  studentId: string;
  scheduleId: string;
  date: string;
  materialStudied: string;
  summary: string;
  tasks: string;
  learningObstacles: string;
  attachmentName: string;
  entryStatus: 'Selesai';
  reviewStatus: 'Belum Ditinjau' | 'Menunggu Review' | 'Tervalidasi' | 'Perlu Revisi';
  notes: string;
  validationStatus: ValidationStatus;
};
