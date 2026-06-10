export type Role = 'siswa' | 'guru' | 'kurikulum' | 'admin';
export type Permission =
  | 'dashboard.view'
  | 'student.attendance.view'
  | 'student.attendance.manage_taught_classes'
  | 'schedule.view'
  | 'student.journal.create'
  | 'student.journal.view_history'
  | 'account.view_own'
  | 'teacher.attendance.view_own'
  | 'teacher.attendance.create'
  | 'learning.material.create'
  | 'student.journal.view_taught_classes'
  | 'assessment.manage'
  | 'teaching.history.view_own'
  | 'dashboard.monitor'
  | 'teacher.attendance.monitor'
  | 'learning.material.monitor'
  | 'student.journal.monitor'
  | 'report.view'
  | 'validation.manage'
  | 'admin.dashboard.view'
  | 'master.data.manage';

export interface User {
  id: string;
  role: Role;
  identifier: string;
  password: string;
  name: string;
  referenceId: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  nisn: string;
  classId: string;
  email: string;
  avatar: string;
  userId?: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  nip: string;
  subjectIds: string[];
  email: string;
  userId?: string;
}

export interface CurriculumProfile {
  id: string;
  name: string;
  nip: string;
  employeeId: string;
  email: string;
  userId?: string;
}

export interface AdminProfile {
  id: string;
  name: string;
  nip: string;
  email: string;
  userId?: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  major: string;
  homeroomTeacherId: string;
}

export interface Subject {
  id: string;
  name: string;
  shortName: string;
}

export interface Schedule {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  day: number;
  startTime: string;
  endTime: string;
  room: string;
}

export type StudentAttendanceStatus = 'Hadir' | 'Izin' | 'Alfa';

export interface StudentAttendance {
  id: string;
  studentId: string;
  scheduleId: string;
  date: string;
  status: StudentAttendanceStatus;
}

export type TeacherAttendanceStatus = 'Hadir' | 'Izin' | 'Belum Presensi';

export interface TeacherAttendance {
  id: string;
  teacherId: string;
  scheduleId: string;
  date: string;
  status: TeacherAttendanceStatus;
  notes: string;
}

export type ValidationStatus = 'Menunggu' | 'Valid' | 'Ditolak';
export type AlignmentStatus = 'Sesuai' | 'Belum Diisi' | 'Perlu Cek';
export type ActiveStatus = 'Aktif' | 'Nonaktif';
export type AssessmentType = 'pretest' | 'posttest';

export interface LearningMaterial {
  id: string;
  teacherId: string;
  scheduleId: string;
  date: string;
  meeting: number;
  title: string;
  description: string;
  validationStatus: ValidationStatus;
  alignmentStatus: AlignmentStatus;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

export interface AssessmentRecord {
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
  }>;
}

export interface TeacherQuestionnaire {
  id: string;
  studentId: string;
  teacherId: string;
  scheduleId: string;
  date: string;
  completed: boolean;
}

export interface StudentJournal {
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
}

export interface ReportSummary {
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  totalJournals: number;
  totalTeacherAttendances: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success';
  date: string;
  role: Role | 'all';
}

export interface AuthSession {
  userId: string;
  role: Role;
  name: string;
  identifier: string;
  referenceId: string;
}

export interface AppDataState {
  users: User[];
  students: StudentProfile[];
  teachers: TeacherProfile[];
  curricula: CurriculumProfile[];
  admins: AdminProfile[];
  classes: ClassRoom[];
  subjects: Subject[];
  schedules: Schedule[];
  studentAttendances: StudentAttendance[];
  teacherAttendances: TeacherAttendance[];
  learningMaterials: LearningMaterial[];
  assessments: AssessmentRecord[];
  questionnaires: TeacherQuestionnaire[];
  studentJournals: StudentJournal[];
}

export interface MockData {
  users: User[];
  students: StudentProfile[];
  teachers: TeacherProfile[];
  curricula: CurriculumProfile[];
  admins: AdminProfile[];
  classes: ClassRoom[];
  subjects: Subject[];
  schedules: Schedule[];
  studentAttendances: StudentAttendance[];
  teacherAttendances: TeacherAttendance[];
  learningMaterials: LearningMaterial[];
  assessments: AssessmentRecord[];
  questionnaires: TeacherQuestionnaire[];
  studentJournals: StudentJournal[];
  notifications: NotificationItem[];
  reportSummary: ReportSummary;
}
