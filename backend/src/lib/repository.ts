import { createHash, randomUUID } from 'node:crypto';
import {
  admins as mockAdmins,
  classes as mockClasses,
  curricula as mockCurricula,
  getAcademicToday,
  getDateOrAcademicToday,
  getScheduleView as getMockScheduleView,
  getTodayDate,
  assessments as mockAssessments,
  learningMaterials as mockLearningMaterials,
  parseISODate,
  questionnaires as mockQuestionnaires,
  schedules as mockSchedules,
  studentAttendances as mockStudentAttendances,
  studentJournals as mockStudentJournals,
  students as mockStudents,
  subjects as mockSubjects,
  teacherAttendances as mockTeacherAttendances,
  teachers as mockTeachers,
  users as mockUsers,
} from '@/lib/data';
import { getSupabaseAdmin } from '@/lib/supabase';
import type {
  Admin,
  AssessmentQuestion,
  AssessmentRecord,
  AssessmentStudentAnswer,
  ClassRoom,
  Curriculum,
  LearningMaterial,
  QuestionnaireRatings,
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

type AppUserRow = {
  id: string;
  role: User['role'];
  identifier: string;
  password_hash: string;
  name: string;
  reference_id: string;
};

type StudentRow = {
  id: string;
  user_id: string | null;
  name: string;
  nisn: string;
  class_id: string;
  email: string;
  avatar: string;
};

type TeacherRow = {
  id: string;
  user_id: string | null;
  name: string;
  nip: string;
  email: string;
};

type CurriculumRow = {
  id: string;
  user_id: string | null;
  name: string;
  nip: string;
  employee_id: string;
  email: string;
};

type AdminRow = {
  id: string;
  user_id: string | null;
  name: string;
  nip: string;
  email: string;
};

type ClassRow = {
  id: string;
  name: string;
  major: string;
  homeroom_teacher_id: string | null;
};

type SubjectRow = {
  id: string;
  name: string;
  short_name: string;
};

type ScheduleRow = {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day: number;
  start_time: string;
  end_time: string;
  room: string;
};

type TeacherAttendanceRow = {
  id: string;
  teacher_id: string;
  schedule_id: string;
  date: string;
  status: TeacherAttendance['status'];
  notes: string | null;
};

type StudentAttendanceRow = {
  id: string;
  student_id: string;
  schedule_id: string;
  date: string;
  status: StudentAttendance['status'];
};

type LearningMaterialRow = {
  id: string;
  teacher_id: string;
  schedule_id: string;
  date: string;
  meeting: number;
  title: string;
  description: string;
  validation_status: LearningMaterial['validationStatus'];
  alignment_status: LearningMaterial['alignmentStatus'];
};

type AssessmentRow = {
  id: string;
  type: AssessmentRecord['type'];
  teacher_id: string;
  schedule_id: string;
  class_id: string;
  subject_id: string;
  date: string;
  meeting: number;
  question_count: number;
  status: AssessmentRecord['status'];
};

type AssessmentQuestionRow = {
  id: string;
  assessment_id: string;
  question: string;
  options: unknown;
  answer: string;
  position: number;
};

type AssessmentStudentStatusRow = {
  assessment_id: string;
  student_id: string;
  completed: boolean;
  completed_at: string | null;
  score?: number | null;
};

type AssessmentStudentAnswerRow = {
  assessment_id: string;
  student_id: string;
  question_id: string;
  answer: string;
  correct: boolean;
};

type TeacherQuestionnaireRow = {
  id: string;
  student_id: string;
  teacher_id: string;
  schedule_id: string;
  date: string;
  completed: boolean;
  ratings?: Partial<QuestionnaireRatings> | null;
  note?: string | null;
};

type StudentJournalRow = {
  id: string;
  student_id: string;
  schedule_id: string;
  date: string;
  material_studied: string;
  summary: string;
  tasks: string;
  learning_obstacles: string;
  attachment_name: string | null;
  entry_status: StudentJournal['entryStatus'];
  review_status: StudentJournal['reviewStatus'];
  notes: string;
  validation_status: StudentJournal['validationStatus'];
};

export class RepositoryError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'RepositoryError';
    this.status = status;
  }
}

export type CreateAccountInput = {
  role: User['role'];
  identifier: string;
  password: string;
  name: string;
  email?: string;
  referenceId?: string;
  classId?: string;
  employeeId?: string;
  subjectIds?: string[];
};

export type UpdateAccountCredentialsInput = {
  id: string;
  identifier: string;
  password?: string;
};

export type SaveClassInput = {
  id?: string;
  name: string;
  major: string;
  homeroomTeacherId?: string;
};

export type SaveSubjectInput = {
  id?: string;
  name: string;
  shortName: string;
};

export type SaveStudentInput = {
  id?: string;
  name: string;
  nisn: string;
  classId: string;
  email?: string;
  avatar?: string;
};

export type SaveTeacherInput = {
  id?: string;
  name: string;
  nip: string;
  email: string;
  subjectIds?: string[];
};

export type SaveScheduleInput = {
  id?: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  day: number;
  startTime: string;
  endTime: string;
  room: string;
};

export type AssessmentAnswerInput = {
  questionId: string;
  answer: string;
};

function toShortTime(value: string) {
  return value.slice(0, 5);
}

function hashPassword(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function createTextId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

function createEmailFallback(identifier: string) {
  const safeIdentifier = identifier.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'akun';
  return `${safeIdentifier}@smkn2.local`;
}

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'NA'
  );
}

function getReferencePrefix(role: User['role']) {
  return {
    siswa: 'std',
    guru: 't',
    kurikulum: 'kur',
    admin: 'adm',
  }[role];
}

function encodeRoleScopedIdentifier(role: User['role'], identifier: string) {
  return `${role}:${identifier}`;
}

function decodeRoleScopedIdentifier(role: User['role'], identifier: string) {
  const prefix = `${role}:`;
  return identifier.startsWith(prefix) ? identifier.slice(prefix.length) : identifier;
}

function getLoginIdentifierCandidates(identifier: string) {
  const roles: User['role'][] = ['siswa', 'guru', 'kurikulum', 'admin'];
  return [identifier, ...roles.map((role) => encodeRoleScopedIdentifier(role, identifier))];
}

function slugifyId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

function toUser(row: AppUserRow): User {
  return {
    id: row.id,
    role: row.role,
    identifier: decodeRoleScopedIdentifier(row.role, row.identifier),
    password: row.password_hash,
    name: row.name,
    referenceId: row.reference_id,
  };
}

function toStudent(row: StudentRow): Student {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    name: row.name,
    nisn: row.nisn,
    classId: row.class_id,
    email: row.email,
    avatar: row.avatar,
  };
}

function toTeacher(row: TeacherRow, subjectIds: string[] = []): Teacher {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    name: row.name,
    nip: decodeRoleScopedIdentifier('guru', row.nip),
    subjectIds,
    email: row.email,
  };
}

function toCurriculum(row: CurriculumRow): Curriculum {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    name: row.name,
    nip: decodeRoleScopedIdentifier('kurikulum', row.nip),
    employeeId: decodeRoleScopedIdentifier('kurikulum', row.employee_id),
    email: row.email,
  };
}

function toAdmin(row: AdminRow): Admin {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    name: row.name,
    nip: decodeRoleScopedIdentifier('admin', row.nip),
    email: row.email,
  };
}

function toClass(row: ClassRow): ClassRoom {
  return {
    id: row.id,
    name: row.name,
    major: row.major,
    homeroomTeacherId: row.homeroom_teacher_id ?? '',
  };
}

function toSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
  };
}

function toSchedule(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    classId: row.class_id,
    subjectId: row.subject_id,
    teacherId: row.teacher_id,
    day: row.day,
    startTime: toShortTime(row.start_time),
    endTime: toShortTime(row.end_time),
    room: row.room,
  };
}

function toTeacherAttendance(row: TeacherAttendanceRow): TeacherAttendance {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    scheduleId: row.schedule_id,
    date: row.date,
    status: row.status,
    notes: row.notes ?? '',
  };
}

function toStudentAttendance(row: StudentAttendanceRow): StudentAttendance {
  return {
    id: row.id,
    studentId: row.student_id,
    scheduleId: row.schedule_id,
    date: row.date,
    status: row.status,
  };
}

function toLearningMaterial(row: LearningMaterialRow): LearningMaterial {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    scheduleId: row.schedule_id,
    date: row.date,
    meeting: row.meeting,
    title: row.title,
    description: row.description,
    validationStatus: row.validation_status,
    alignmentStatus: row.alignment_status,
  };
}

function toAssessmentQuestion(row: AssessmentQuestionRow): AssessmentQuestion {
  return {
    id: row.id,
    question: row.question,
    options: Array.isArray(row.options) ? row.options.map(String) : [],
    answer: row.answer,
  };
}

function toAssessmentStudentAnswer(row: AssessmentStudentAnswerRow): AssessmentStudentAnswer {
  return {
    questionId: row.question_id,
    answer: row.answer,
    correct: row.correct,
  };
}

function toAssessment(
  row: AssessmentRow,
  questions: AssessmentQuestion[],
  studentStatuses: AssessmentRecord['studentStatuses'],
): AssessmentRecord {
  return {
    id: row.id,
    type: row.type,
    teacherId: row.teacher_id,
    scheduleId: row.schedule_id,
    classId: row.class_id,
    subjectId: row.subject_id,
    date: row.date,
    meeting: row.meeting,
    questionCount: row.question_count,
    status: row.status,
    questions,
    studentStatuses,
  };
}

function toTeacherQuestionnaire(row: TeacherQuestionnaireRow): TeacherQuestionnaire {
  return {
    id: row.id,
    studentId: row.student_id,
    teacherId: row.teacher_id,
    scheduleId: row.schedule_id,
    date: row.date,
    completed: row.completed,
    ratings: row.ratings ?? undefined,
    note: row.note ?? '',
  };
}

function toStudentJournal(row: StudentJournalRow): StudentJournal {
  return {
    id: row.id,
    studentId: row.student_id,
    scheduleId: row.schedule_id,
    date: row.date,
    materialStudied: row.material_studied,
    summary: row.summary,
    tasks: row.tasks,
    learningObstacles: row.learning_obstacles,
    attachmentName: row.attachment_name ?? '',
    entryStatus: row.entry_status,
    reviewStatus: row.review_status,
    notes: row.notes,
    validationStatus: row.validation_status,
  };
}

type SupabaseRepositoryError = {
  code?: string;
  details?: string | null;
  message: string;
};

function isMissingSupabaseTable(error: SupabaseRepositoryError | null, tableName: string) {
  if (!error) {
    return false;
  }

  const errorText = `${error.message} ${error.details ?? ''}`;
  return (
    errorText.includes(tableName) &&
    (error.code === 'PGRST205' || errorText.includes('schema cache') || errorText.includes('does not exist'))
  );
}

function isMissingSupabaseColumn(error: SupabaseRepositoryError | null, columnName: string) {
  if (!error) {
    return false;
  }

  const errorText = `${error.message} ${error.details ?? ''}`;
  return (
    errorText.includes(columnName) &&
    (error.code === 'PGRST204' || errorText.includes('schema cache') || errorText.includes('column'))
  );
}

function throwSupabaseError(message: string, error: SupabaseRepositoryError | null) {
  if (error) {
    throw new Error(`${message}: ${error.message}`);
  }
}

async function getTeacherSubjectIds(teacherId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return mockTeachers.find((teacher) => teacher.id === teacherId)?.subjectIds ?? [];
  }

  const { data, error } = await supabase
    .from('teacher_subjects')
    .select('subject_id')
    .eq('teacher_id', teacherId);

  throwSupabaseError('Gagal mengambil mapel guru', error);
  return (data ?? []).map((item) => item.subject_id as string);
}

export function getRepositoryDateOrAcademicToday(date?: string | null) {
  return getDateOrAcademicToday(date);
}

export function parseRepositoryISODate(date: string) {
  return parseISODate(date);
}

export function getRepositoryTodayDate() {
  return getTodayDate();
}

export function getRepositoryAcademicToday(reference?: Date) {
  return getAcademicToday(reference);
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

export async function findUserById(userId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return mockUsers.find((user) => user.id === userId) ?? null;
  }

  const { data, error } = await supabase.from('app_users').select('*').eq('id', userId).maybeSingle();
  throwSupabaseError('Gagal mengambil user', error);
  return data ? toUser(data as AppUserRow) : null;
}

export async function findUserForLogin(identifier: string, password: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return (
      mockUsers.find(
        (candidate) =>
          decodeRoleScopedIdentifier(candidate.role, candidate.identifier) === identifier && candidate.password === password,
      ) ?? null
    );
  }

  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('password_hash', hashPassword(password))
    .in('identifier', getLoginIdentifierCandidates(identifier))
    .order('created_at', { ascending: false });

  throwSupabaseError('Gagal memeriksa login', error);
  const users = (data ?? []).map((row) => toUser(row as AppUserRow));
  return users[0] ?? null;
}

export async function listUsers() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [...mockUsers].sort((first, second) => first.role.localeCompare(second.role) || first.name.localeCompare(second.name));
  }

  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .order('role', { ascending: true })
    .order('name', { ascending: true });

  throwSupabaseError('Gagal mengambil daftar akun', error);
  return (data ?? []).map((row) => toUser(row as AppUserRow));
}

export async function createAccount(input: CreateAccountInput) {
  const identifier = input.identifier.trim();
  const name = input.name.trim();
  const email = input.email?.trim() || createEmailFallback(identifier);

  if (!identifier || !name || input.password.length < 6) {
    throw new RepositoryError('Nama, identitas login, dan password minimal 6 karakter wajib diisi.', 422);
  }

  if (input.role === 'kurikulum' && !input.employeeId?.trim()) {
    throw new RepositoryError('ID pegawai wajib diisi saat membuat akun kurikulum.', 422);
  }

  const userId = createTextId('user');
  let referenceId = createTextId(getReferencePrefix(input.role));

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    if (mockUsers.some((user) => user.role === input.role && user.identifier === identifier)) {
      throw new RepositoryError('NISN/NIP/username sudah digunakan akun lain pada role yang sama.', 409);
    }

    let linkedStudent: Student | null = null;
    let newStudentClassId = '';
    let linkedTeacher: Teacher | null = null;

    if (input.role === 'siswa') {
      const requestedStudentId = input.referenceId?.trim();
      linkedStudent = requestedStudentId
        ? mockStudents.find((student) => student.id === requestedStudentId) ?? null
        : mockStudents.find((student) => student.nisn === identifier) ?? null;

      if (!linkedStudent && requestedStudentId) {
        throw new RepositoryError('Profil siswa yang dipilih tidak ditemukan.', 404);
      }

      if (!linkedStudent) {
        newStudentClassId = input.classId?.trim() ?? '';

        if (!newStudentClassId) {
          throw new RepositoryError('Pilih kelas siswa terlebih dahulu untuk membuat akun siswa baru.', 422);
        }

        if (!mockClasses.some((classRoom) => classRoom.id === newStudentClassId)) {
          throw new RepositoryError('Kelas siswa tidak ditemukan di database.', 422);
        }
      }

      if (linkedStudent && linkedStudent.nisn !== identifier) {
        throw new RepositoryError('Identitas login akun siswa harus sama dengan NISN profil siswa.', 422);
      }

      const linkedStudentId = linkedStudent?.id;

      if (linkedStudentId && (linkedStudent?.userId || mockUsers.some((user) => user.referenceId === linkedStudentId))) {
        throw new RepositoryError('Siswa ini sudah memiliki akun login.', 409);
      }

      referenceId = linkedStudent?.id ?? referenceId;
    }

    if (input.role === 'guru') {
      const requestedTeacherId = input.referenceId?.trim();
      linkedTeacher = requestedTeacherId
        ? mockTeachers.find((teacher) => teacher.id === requestedTeacherId) ?? null
        : mockTeachers.find((teacher) => teacher.nip === identifier) ?? null;

      if (requestedTeacherId && !linkedTeacher) {
        throw new RepositoryError('Profil guru yang dipilih tidak ditemukan.', 404);
      }

      if (linkedTeacher && linkedTeacher.nip !== identifier) {
        throw new RepositoryError('Identitas login akun guru harus sama dengan NIP profil guru.', 422);
      }

      if (linkedTeacher) {
        const linkedTeacherId = linkedTeacher.id;

        if (linkedTeacher.userId || mockUsers.some((user) => user.role === 'guru' && user.referenceId === linkedTeacherId)) {
          throw new RepositoryError('Guru ini sudah memiliki akun login.', 409);
        }

        referenceId = linkedTeacher.id;
      }
    }

    const user: User = {
      id: userId,
      role: input.role,
      identifier,
      password: input.password,
      name,
      referenceId,
    };

    mockUsers.unshift(user);

    if (input.role === 'siswa') {
      if (linkedStudent) {
        linkedStudent.userId = userId;
      } else {
        mockStudents.unshift({
          id: referenceId,
          userId,
          name,
          nisn: identifier,
          classId: newStudentClassId,
          email,
          avatar: getInitials(name),
        });
      }
    } else if (input.role === 'guru') {
      if (linkedTeacher) {
        linkedTeacher.userId = userId;
      } else {
        mockTeachers.unshift({
          id: referenceId,
          userId,
          name,
          nip: identifier,
          email,
          subjectIds: input.subjectIds ?? [],
        });
      }
    } else if (input.role === 'kurikulum') {
      mockCurricula.unshift({
        id: referenceId,
        userId,
        name,
        nip: identifier,
        employeeId: input.employeeId?.trim() ?? '',
        email,
      });
    } else {
      mockAdmins.unshift({
        id: referenceId,
        userId,
        name,
        nip: identifier,
        email,
      });
    }

    return user;
  }

  const { data: existingUsers, error: existingUserError } = await supabase
    .from('app_users')
    .select('id')
    .eq('role', input.role)
    .in('identifier', [identifier, encodeRoleScopedIdentifier(input.role, identifier)])
    .limit(1);

  throwSupabaseError('Gagal memeriksa akun', existingUserError);

  if ((existingUsers ?? []).length > 0) {
    throw new RepositoryError('NISN/NIP/username sudah digunakan akun lain pada role yang sama.', 409);
  }

  const { data: existingIdentifierUsers, error: existingIdentifierUserError } = await supabase
    .from('app_users')
    .select('id, role')
    .eq('identifier', identifier)
    .limit(1);

  throwSupabaseError('Gagal memeriksa identitas akun', existingIdentifierUserError);

  const storedIdentifier = (existingIdentifierUsers ?? []).length > 0
    ? encodeRoleScopedIdentifier(input.role, identifier)
    : identifier;
  const curriculumProfileNip = encodeRoleScopedIdentifier('kurikulum', identifier);
  const curriculumEmployeeId = encodeRoleScopedIdentifier('kurikulum', input.employeeId?.trim() ?? '');

  let linkedStudent: Student | null = null;
  let newStudentClassId = '';
  let linkedTeacher: Teacher | null = null;

  if (input.role === 'siswa') {
    const requestedStudentId = input.referenceId?.trim();
    linkedStudent = requestedStudentId ? await getStudentById(requestedStudentId) : await getStudentByNisn(identifier);

    if (!linkedStudent && requestedStudentId) {
      throw new RepositoryError('Profil siswa yang dipilih tidak ditemukan.', 404);
    }

    if (!linkedStudent) {
      newStudentClassId = input.classId?.trim() ?? '';

      if (!newStudentClassId) {
        throw new RepositoryError('Pilih kelas siswa terlebih dahulu untuk membuat akun siswa baru.', 422);
      }

      const classRoom = await getClassById(newStudentClassId);
      if (!classRoom) {
        throw new RepositoryError('Kelas siswa tidak ditemukan di database.', 422);
      }
    }

    if (linkedStudent && linkedStudent.nisn !== identifier) {
      throw new RepositoryError('Identitas login akun siswa harus sama dengan NISN profil siswa.', 422);
    }

    if (linkedStudent) {
      const { data: existingProfileUser, error: existingProfileUserError } = await supabase
        .from('app_users')
        .select('id')
        .eq('role', 'siswa')
        .eq('reference_id', linkedStudent.id)
        .maybeSingle();

      throwSupabaseError('Gagal memeriksa akun siswa', existingProfileUserError);

      if (linkedStudent.userId || existingProfileUser) {
        throw new RepositoryError('Siswa ini sudah memiliki akun login.', 409);
      }

      referenceId = linkedStudent.id;
    }
  }

  if (input.role === 'guru') {
    const requestedTeacherId = input.referenceId?.trim();
    linkedTeacher = requestedTeacherId ? await getTeacherById(requestedTeacherId) : await getTeacherByNip(identifier);

    if (requestedTeacherId && !linkedTeacher) {
      throw new RepositoryError('Profil guru yang dipilih tidak ditemukan.', 404);
    }

    if (linkedTeacher && linkedTeacher.nip !== identifier) {
      throw new RepositoryError('Identitas login akun guru harus sama dengan NIP profil guru.', 422);
    }

    if (linkedTeacher) {
      const { data: existingProfileUser, error: existingProfileUserError } = await supabase
        .from('app_users')
        .select('id')
        .eq('role', 'guru')
        .eq('reference_id', linkedTeacher.id)
        .maybeSingle();

      throwSupabaseError('Gagal memeriksa akun guru', existingProfileUserError);

      if (linkedTeacher.userId || existingProfileUser) {
        throw new RepositoryError('Guru ini sudah memiliki akun login.', 409);
      }

      referenceId = linkedTeacher.id;
    } else {
      const subjectIds = input.subjectIds?.filter(Boolean) ?? [];
      for (const subjectId of subjectIds) {
        const subject = await getSubjectById(subjectId);
        if (!subject) {
          throw new RepositoryError('Ada mata pelajaran yang tidak ditemukan di database.', 422);
        }
      }
    }
  }

  const { data: userData, error: userError } = await supabase
    .from('app_users')
    .insert({
      id: userId,
      role: input.role,
      identifier: storedIdentifier,
      password_hash: hashPassword(input.password),
      name,
      reference_id: referenceId,
    })
    .select()
    .single();

  throwSupabaseError('Gagal membuat akun', userError);

  try {
    if (input.role === 'siswa') {
      if (linkedStudent) {
        const { error } = await supabase.from('students').update({ user_id: userId }).eq('id', referenceId);
        throwSupabaseError('Gagal menghubungkan akun ke profil siswa', error);
      } else {
        const { error } = await supabase.from('students').insert({
          id: referenceId,
          user_id: userId,
          name,
          nisn: identifier,
          class_id: newStudentClassId,
          email,
          avatar: getInitials(name),
        });
        throwSupabaseError('Gagal membuat profil siswa', error);
      }
    } else if (input.role === 'guru') {
      if (linkedTeacher) {
        const { error } = await supabase.from('teachers').update({ user_id: userId }).eq('id', linkedTeacher.id);
        throwSupabaseError('Gagal menghubungkan akun ke profil guru', error);
      } else {
        const { error } = await supabase.from('teachers').insert({
          id: referenceId,
          user_id: userId,
          name,
          nip: identifier,
          email,
        });
        throwSupabaseError('Gagal membuat profil guru', error);

        const subjectIds = input.subjectIds?.filter(Boolean) ?? [];
        if (subjectIds.length > 0) {
          const { error: subjectError } = await supabase.from('teacher_subjects').insert(
            subjectIds.map((subjectId) => ({
              teacher_id: referenceId,
              subject_id: subjectId,
            })),
          );
          throwSupabaseError('Gagal menyimpan mapel guru', subjectError);
        }
      }
    } else if (input.role === 'kurikulum') {
      const { error } = await supabase.from('curricula').insert({
        id: referenceId,
        user_id: userId,
        name,
        nip: curriculumProfileNip,
        employee_id: curriculumEmployeeId,
        email,
      });
      throwSupabaseError('Gagal membuat profil kurikulum', error);
    } else {
      const { error } = await supabase.from('admins').insert({
        id: referenceId,
        user_id: userId,
        name,
        nip: identifier,
        email,
      });
      throwSupabaseError('Gagal membuat profil Super Admin', error);
    }
  } catch (error) {
    await supabase.from('app_users').delete().eq('id', userId);

    if (error instanceof Error && error.message.includes('duplicate key')) {
      if (input.role === 'kurikulum') {
        throw new RepositoryError(
          'Profil kurikulum dengan NIP atau ID pegawai ini sudah ada. Gunakan ID pegawai kurikulum yang berbeda.',
          409,
        );
      }

      throw new RepositoryError('Identitas login sudah terdaftar pada profil lain.', 409);
    }

    throw error;
  }

  return toUser(userData as AppUserRow);
}

export async function updateAccountCredentials(input: UpdateAccountCredentialsInput) {
  const accountId = input.id.trim();
  const identifier = input.identifier.trim();
  const password = input.password?.trim() ?? '';

  if (!accountId || !identifier) {
    throw new RepositoryError('ID akun dan username wajib diisi.', 422);
  }

  if (password && password.length < 6) {
    throw new RepositoryError('Password baru minimal 6 karakter.', 422);
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const account = mockUsers.find((user) => user.id === accountId);

    if (!account) {
      throw new RepositoryError('Akun tidak ditemukan.', 404);
    }

    if (account.role === 'admin') {
      throw new RepositoryError('Akun Super Admin tidak dapat diedit dari menu operator.', 403);
    }

    const duplicate = mockUsers.some(
      (user) =>
        user.id !== accountId &&
        user.role === account.role &&
        decodeRoleScopedIdentifier(user.role, user.identifier) === identifier,
    );

    if (duplicate) {
      throw new RepositoryError('Username sudah digunakan akun lain pada role yang sama.', 409);
    }

    account.identifier = identifier;
    if (password) {
      account.password = password;
    }

    return account;
  }

  const { data: accountData, error: accountError } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', accountId)
    .maybeSingle();

  throwSupabaseError('Gagal mengambil akun', accountError);

  if (!accountData) {
    throw new RepositoryError('Akun tidak ditemukan.', 404);
  }

  const account = toUser(accountData as AppUserRow);

  if (account.role === 'admin') {
    throw new RepositoryError('Akun Super Admin tidak dapat diedit dari menu operator.', 403);
  }

  const { data: sameRoleUsers, error: sameRoleError } = await supabase
    .from('app_users')
    .select('id')
    .eq('role', account.role)
    .in('identifier', [identifier, encodeRoleScopedIdentifier(account.role, identifier)])
    .neq('id', accountId)
    .limit(1);

  throwSupabaseError('Gagal memeriksa username akun', sameRoleError);

  if ((sameRoleUsers ?? []).length > 0) {
    throw new RepositoryError('Username sudah digunakan akun lain pada role yang sama.', 409);
  }

  const { data: existingIdentifierUsers, error: existingIdentifierError } = await supabase
    .from('app_users')
    .select('id')
    .eq('identifier', identifier)
    .neq('id', accountId)
    .limit(1);

  throwSupabaseError('Gagal memeriksa identitas akun', existingIdentifierError);

  const storedIdentifier = (existingIdentifierUsers ?? []).length > 0
    ? encodeRoleScopedIdentifier(account.role, identifier)
    : identifier;
  const updates: Partial<AppUserRow> = {
    identifier: storedIdentifier,
  };

  if (password) {
    updates.password_hash = hashPassword(password);
  }

  const { data: updatedAccount, error: updateError } = await supabase
    .from('app_users')
    .update(updates)
    .eq('id', accountId)
    .select()
    .single();

  throwSupabaseError('Gagal memperbarui akun', updateError);
  return toUser(updatedAccount as AppUserRow);
}

export async function deleteAccount(accountId: string, currentUserId: string) {
  const targetId = accountId.trim();

  if (!targetId) {
    throw new RepositoryError('ID akun tidak valid.', 422);
  }

  if (targetId === currentUserId) {
    throw new RepositoryError('Akun yang sedang digunakan tidak bisa dihapus.', 409);
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const accountIndex = mockUsers.findIndex((user) => user.id === targetId);

    if (accountIndex === -1) {
      throw new RepositoryError('Akun tidak ditemukan.', 404);
    }

    const [deletedAccount] = mockUsers.splice(accountIndex, 1);

    if (deletedAccount.role === 'siswa') {
      const student = mockStudents.find((item) => item.userId === deletedAccount.id);
      if (student) {
        student.userId = undefined;
      }
    } else if (deletedAccount.role === 'guru') {
      const teacher = mockTeachers.find((item) => item.userId === deletedAccount.id);
      if (teacher) {
        teacher.userId = undefined;
      }
    } else if (deletedAccount.role === 'kurikulum') {
      const curriculum = mockCurricula.find((item) => item.userId === deletedAccount.id);
      if (curriculum) {
        curriculum.userId = undefined;
      }
    } else {
      const admin = mockAdmins.find((item) => item.userId === deletedAccount.id);
      if (admin) {
        admin.userId = undefined;
      }
    }

    return;
  }

  const { data: account, error: accountError } = await supabase
    .from('app_users')
    .select('id')
    .eq('id', targetId)
    .maybeSingle();

  throwSupabaseError('Gagal memeriksa akun', accountError);

  if (!account) {
    throw new RepositoryError('Akun tidak ditemukan.', 404);
  }

  const { error } = await supabase.from('app_users').delete().eq('id', targetId);
  throwSupabaseError('Gagal menghapus akun', error);
}

export async function getUserProfile(user: User) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    if (user.role === 'siswa') {
      return mockStudents.find((student) => student.id === user.referenceId) ?? null;
    }
    if (user.role === 'guru') {
      return mockTeachers.find((teacher) => teacher.id === user.referenceId) ?? null;
    }
    if (user.role === 'kurikulum') {
      return mockCurricula.find((curriculum) => curriculum.id === user.referenceId) ?? null;
    }
    return mockAdmins.find((admin) => admin.id === user.referenceId) ?? null;
  }

  if (user.role === 'siswa') {
    const { data, error } = await supabase.from('students').select('*').eq('id', user.referenceId).maybeSingle();
    throwSupabaseError('Gagal mengambil profil siswa', error);
    return data ? toStudent(data as StudentRow) : null;
  }

  if (user.role === 'guru') {
    const { data, error } = await supabase.from('teachers').select('*').eq('id', user.referenceId).maybeSingle();
    throwSupabaseError('Gagal mengambil profil guru', error);
    return data ? toTeacher(data as TeacherRow, await getTeacherSubjectIds(user.referenceId)) : null;
  }

  if (user.role === 'kurikulum') {
    const { data, error } = await supabase.from('curricula').select('*').eq('id', user.referenceId).maybeSingle();
    throwSupabaseError('Gagal mengambil profil kurikulum', error);
    return data ? toCurriculum(data as CurriculumRow) : null;
  }

  const { data, error } = await supabase.from('admins').select('*').eq('id', user.referenceId).maybeSingle();
  throwSupabaseError('Gagal mengambil profil Super Admin', error);
  return data ? toAdmin(data as AdminRow) : null;
}

export async function getStudentById(studentId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return mockStudents.find((student) => student.id === studentId) ?? null;
  }

  const { data, error } = await supabase.from('students').select('*').eq('id', studentId).maybeSingle();
  throwSupabaseError('Gagal mengambil siswa', error);
  return data ? toStudent(data as StudentRow) : null;
}

export async function getStudentByNisn(nisn: string) {
  const normalizedNisn = nisn.trim();

  if (!normalizedNisn) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return mockStudents.find((student) => student.nisn === normalizedNisn) ?? null;
  }

  const { data, error } = await supabase.from('students').select('*').eq('nisn', normalizedNisn).maybeSingle();
  throwSupabaseError('Gagal mengambil siswa', error);
  return data ? toStudent(data as StudentRow) : null;
}

export async function listStudents() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [...mockStudents].sort((first, second) => first.name.localeCompare(second.name));
  }

  const { data, error } = await supabase.from('students').select('*').order('name', { ascending: true });
  throwSupabaseError('Gagal mengambil daftar siswa', error);
  return (data ?? []).map((row) => toStudent(row as StudentRow));
}

export async function saveStudent(input: SaveStudentInput) {
  const name = input.name.trim();
  const nisn = input.nisn.trim();
  const classId = input.classId.trim();
  const email = input.email?.trim() || createEmailFallback(nisn);
  const avatar = (input.avatar?.trim() || getInitials(name)).slice(0, 3).toUpperCase();

  if (!name || !nisn || !classId) {
    throw new RepositoryError('Nama, NISN, dan kelas siswa wajib diisi.', 422);
  }

  const classRoom = await getClassById(classId);
  if (!classRoom) {
    throw new RepositoryError('Kelas tidak ditemukan di database.', 422);
  }

  const supabase = getSupabaseAdmin();
  const id = input.id?.trim() || createTextId('std');

  if (!supabase) {
    const existingIndex = mockStudents.findIndex((item) => item.id === id);
    const student: Student = { id, userId: mockStudents[existingIndex]?.userId, name, nisn, classId, email, avatar };
    if (existingIndex >= 0) {
      mockStudents[existingIndex] = student;
    } else {
      mockStudents.unshift(student);
    }
    return student;
  }

  const payload = {
    id,
    name,
    nisn,
    class_id: classId,
    email,
    avatar,
  };

  const query = input.id
    ? supabase.from('students').update(payload).eq('id', id).select().single()
    : supabase.from('students').insert(payload).select().single();

  const { data, error } = await query;

  if (error?.message.includes('duplicate key')) {
    throw new RepositoryError('NISN siswa sudah digunakan.', 409);
  }

  throwSupabaseError('Gagal menyimpan siswa', error);
  return toStudent(data as StudentRow);
}

export async function getScheduleById(scheduleId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return mockSchedules.find((schedule) => schedule.id === scheduleId) ?? null;
  }

  const { data, error } = await supabase.from('schedules').select('*').eq('id', scheduleId).maybeSingle();
  throwSupabaseError('Gagal mengambil jadwal', error);
  return data ? toSchedule(data as ScheduleRow) : null;
}

export async function getScheduleView(schedule: Schedule) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return getMockScheduleView(schedule);
  }

  const [teacher, classRoom, subject] = await Promise.all([
    getTeacherById(schedule.teacherId),
    getClassById(schedule.classId),
    getSubjectById(schedule.subjectId),
  ]);

  return {
    ...schedule,
    teacher,
    classRoom,
    classroom: classRoom,
    subject,
  };
}

export async function getTeacherById(teacherId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return mockTeachers.find((teacher) => teacher.id === teacherId) ?? null;
  }

  const { data, error } = await supabase.from('teachers').select('*').eq('id', teacherId).maybeSingle();
  throwSupabaseError('Gagal mengambil guru', error);
  return data ? toTeacher(data as TeacherRow, await getTeacherSubjectIds(teacherId)) : null;
}

export async function getTeacherByNip(nip: string) {
  const normalizedNip = nip.trim();

  if (!normalizedNip) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return mockTeachers.find((teacher) => teacher.nip === normalizedNip) ?? null;
  }

  const { data, error } = await supabase.from('teachers').select('*').eq('nip', normalizedNip).maybeSingle();
  throwSupabaseError('Gagal mengambil guru', error);

  if (!data) {
    return null;
  }

  const teacher = data as TeacherRow;
  return toTeacher(teacher, await getTeacherSubjectIds(teacher.id));
}

export async function listTeachers() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [...mockTeachers].sort((first, second) => first.name.localeCompare(second.name));
  }

  const { data, error } = await supabase.from('teachers').select('*').order('name', { ascending: true });
  throwSupabaseError('Gagal mengambil daftar guru', error);

  return Promise.all(
    (data ?? []).map(async (row) => {
      const teacher = row as TeacherRow;
      return toTeacher(teacher, await getTeacherSubjectIds(teacher.id));
    }),
  );
}

export async function listCurricula() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [...mockCurricula].sort((first, second) => first.name.localeCompare(second.name));
  }

  const { data, error } = await supabase.from('curricula').select('*').order('name', { ascending: true });
  throwSupabaseError('Gagal mengambil daftar kurikulum', error);
  return (data ?? []).map((row) => toCurriculum(row as CurriculumRow));
}

export async function saveTeacher(input: SaveTeacherInput) {
  const name = input.name.trim();
  const nip = input.nip.trim();
  const email = input.email.trim();
  const subjectIds = input.subjectIds?.filter(Boolean) ?? [];

  if (!name || !nip || !email) {
    throw new RepositoryError('Nama, NIP, dan email guru wajib diisi.', 422);
  }

  for (const subjectId of subjectIds) {
    const subject = await getSubjectById(subjectId);
    if (!subject) {
      throw new RepositoryError('Ada mata pelajaran yang tidak ditemukan di database.', 422);
    }
  }

  const supabase = getSupabaseAdmin();
  const id = input.id?.trim() || createTextId('t');

  if (!supabase) {
    const teacher: Teacher = { id, name, nip, email, subjectIds };
    const existingIndex = mockTeachers.findIndex((item) => item.id === id);
    if (existingIndex >= 0) {
      mockTeachers[existingIndex] = teacher;
    } else {
      mockTeachers.unshift(teacher);
    }
    return teacher;
  }

  const payload = { id, name, nip, email };
  const query = input.id
    ? supabase.from('teachers').update(payload).eq('id', id).select().single()
    : supabase.from('teachers').insert(payload).select().single();

  const { data, error } = await query;

  if (error?.message.includes('duplicate key')) {
    throw new RepositoryError('NIP guru sudah digunakan.', 409);
  }

  throwSupabaseError('Gagal menyimpan guru', error);

  const { error: deleteError } = await supabase.from('teacher_subjects').delete().eq('teacher_id', id);
  throwSupabaseError('Gagal memperbarui mapel guru', deleteError);

  if (subjectIds.length > 0) {
    const { error: insertError } = await supabase.from('teacher_subjects').insert(
      subjectIds.map((subjectId) => ({
        teacher_id: id,
        subject_id: subjectId,
      })),
    );
    throwSupabaseError('Gagal menyimpan mapel guru', insertError);
  }

  return toTeacher(data as TeacherRow, subjectIds);
}

export async function getClassById(classId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return mockClasses.find((classRoom) => classRoom.id === classId) ?? null;
  }

  const { data, error } = await supabase.from('classes').select('*').eq('id', classId).maybeSingle();
  throwSupabaseError('Gagal mengambil kelas', error);
  return data ? toClass(data as ClassRow) : null;
}

export async function listClasses() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [...mockClasses].sort((first, second) => first.name.localeCompare(second.name));
  }

  const { data, error } = await supabase.from('classes').select('*').order('name', { ascending: true });
  throwSupabaseError('Gagal mengambil daftar kelas', error);
  return (data ?? []).map((row) => toClass(row as ClassRow));
}

export async function saveClass(input: SaveClassInput) {
  const name = input.name.trim();
  const major = input.major.trim();
  const homeroomTeacherId = input.homeroomTeacherId?.trim() || null;

  if (!name || !major) {
    throw new RepositoryError('Nama kelas dan jurusan wajib diisi.', 422);
  }

  if (homeroomTeacherId) {
    const teacher = await getTeacherById(homeroomTeacherId);
    if (!teacher) {
      throw new RepositoryError('Wali kelas tidak ditemukan di database.', 422);
    }
  }

  const supabase = getSupabaseAdmin();
  const id = input.id?.trim() || `cls-${slugifyId(name) || randomUUID().slice(0, 8)}`;

  if (!supabase) {
    const classRoom: ClassRoom = {
      id,
      name,
      major,
      homeroomTeacherId: homeroomTeacherId ?? '',
    };

    const existingIndex = mockClasses.findIndex((item) => item.id === id);
    if (existingIndex >= 0) {
      mockClasses[existingIndex] = classRoom;
    } else {
      mockClasses.unshift(classRoom);
    }
    return classRoom;
  }

  const payload = {
    id,
    name,
    major,
    homeroom_teacher_id: homeroomTeacherId,
  };

  const query = input.id
    ? supabase.from('classes').update(payload).eq('id', id).select().single()
    : supabase.from('classes').insert(payload).select().single();

  const { data, error } = await query;

  if (error?.message.includes('duplicate key')) {
    throw new RepositoryError('Nama kelas atau ID kelas sudah digunakan.', 409);
  }

  throwSupabaseError('Gagal menyimpan kelas', error);
  return toClass(data as ClassRow);
}

export async function getSubjectById(subjectId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return mockSubjects.find((subject) => subject.id === subjectId) ?? null;
  }

  const { data, error } = await supabase.from('subjects').select('*').eq('id', subjectId).maybeSingle();
  throwSupabaseError('Gagal mengambil mapel', error);
  return data ? toSubject(data as SubjectRow) : null;
}

export async function listSubjects() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [...mockSubjects].sort((first, second) => first.name.localeCompare(second.name));
  }

  const { data, error } = await supabase.from('subjects').select('*').order('name', { ascending: true });
  throwSupabaseError('Gagal mengambil daftar mapel', error);
  return (data ?? []).map((row) => toSubject(row as SubjectRow));
}

export async function saveSubject(input: SaveSubjectInput) {
  const name = input.name.trim();
  const shortName = input.shortName.trim();

  if (!name || !shortName) {
    throw new RepositoryError('Nama mata pelajaran dan singkatan wajib diisi.', 422);
  }

  const supabase = getSupabaseAdmin();
  const id = input.id?.trim() || `sub-${slugifyId(shortName || name) || randomUUID().slice(0, 8)}`;

  if (!supabase) {
    const subject: Subject = { id, name, shortName };
    const existingIndex = mockSubjects.findIndex((item) => item.id === id);
    if (existingIndex >= 0) {
      mockSubjects[existingIndex] = subject;
    } else {
      mockSubjects.unshift(subject);
    }
    return subject;
  }

  const payload = {
    id,
    name,
    short_name: shortName,
  };

  const query = input.id
    ? supabase.from('subjects').update(payload).eq('id', id).select().single()
    : supabase.from('subjects').insert(payload).select().single();

  const { data, error } = await query;

  if (error?.message.includes('duplicate key')) {
    throw new RepositoryError('Nama atau ID mata pelajaran sudah digunakan.', 409);
  }

  throwSupabaseError('Gagal menyimpan mata pelajaran', error);
  return toSubject(data as SubjectRow);
}

export async function getSchedulesForClass(classId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return mockSchedules
      .filter((schedule) => schedule.classId === classId)
      .sort((first, second) => first.day - second.day || first.startTime.localeCompare(second.startTime));
  }

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('class_id', classId)
    .order('day', { ascending: true })
    .order('start_time', { ascending: true });

  throwSupabaseError('Gagal mengambil jadwal kelas', error);
  return (data ?? []).map((row) => toSchedule(row as ScheduleRow));
}

export async function getTeacherSchedulesForDay(teacherId: string, day: number) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return mockSchedules
      .filter((schedule) => schedule.teacherId === teacherId && schedule.day === day)
      .sort((first, second) => first.startTime.localeCompare(second.startTime));
  }

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('day', day)
    .order('start_time', { ascending: true });

  throwSupabaseError('Gagal mengambil jadwal guru', error);
  return (data ?? []).map((row) => toSchedule(row as ScheduleRow));
}

export async function listSchedules() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [...mockSchedules].sort(
      (first, second) => first.day - second.day || first.startTime.localeCompare(second.startTime),
    );
  }

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .order('day', { ascending: true })
    .order('start_time', { ascending: true });

  throwSupabaseError('Gagal mengambil daftar jadwal', error);
  return (data ?? []).map((row) => toSchedule(row as ScheduleRow));
}

export async function saveSchedule(input: SaveScheduleInput) {
  const classId = input.classId.trim();
  const subjectId = input.subjectId.trim();
  const teacherId = input.teacherId.trim();
  const startTime = input.startTime.trim();
  const endTime = input.endTime.trim();
  const room = input.room.trim();

  if (!classId || !subjectId || !teacherId || !startTime || !endTime || !room) {
    throw new RepositoryError('Kelas, mapel, guru, jam, dan ruang wajib diisi.', 422);
  }

  if (input.day < 1 || input.day > 5) {
    throw new RepositoryError('Hari jadwal tidak valid.', 422);
  }

  const [classRoom, subject, teacher] = await Promise.all([
    getClassById(classId),
    getSubjectById(subjectId),
    getTeacherById(teacherId),
  ]);

  if (!classRoom) {
    throw new RepositoryError('Kelas tidak ditemukan di database.', 422);
  }
  if (!subject) {
    throw new RepositoryError('Mata pelajaran tidak ditemukan di database.', 422);
  }
  if (!teacher) {
    throw new RepositoryError('Guru tidak ditemukan di database.', 422);
  }
  if (startTime >= endTime) {
    throw new RepositoryError('Jam mulai harus lebih awal dari jam selesai.', 422);
  }

  const supabase = getSupabaseAdmin();
  const id =
    input.id?.trim() ||
    `sch-${slugifyId(`${classRoom.name}-${input.day}-${subject.shortName}-${teacher.name}`) || randomUUID().slice(0, 8)}`;

  if (!supabase) {
    const schedule: Schedule = { id, classId, subjectId, teacherId, day: input.day, startTime, endTime, room };
    const existingIndex = mockSchedules.findIndex((item) => item.id === id);
    if (existingIndex >= 0) {
      mockSchedules[existingIndex] = schedule;
    } else {
      mockSchedules.unshift(schedule);
    }
    return schedule;
  }

  const payload = {
    id,
    class_id: classId,
    subject_id: subjectId,
    teacher_id: teacherId,
    day: input.day,
    start_time: startTime,
    end_time: endTime,
    room,
  };

  const query = input.id
    ? supabase.from('schedules').update(payload).eq('id', id).select().single()
    : supabase.from('schedules').insert(payload).select().single();

  const { data, error } = await query;

  if (error?.message.includes('duplicate key')) {
    throw new RepositoryError('ID jadwal sudah digunakan.', 409);
  }

  throwSupabaseError('Gagal menyimpan jadwal', error);
  return toSchedule(data as ScheduleRow);
}

export async function getStudentsForClass(classId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return mockStudents
      .filter((student) => student.classId === classId)
      .sort((first, second) => first.name.localeCompare(second.name));
  }

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', classId)
    .order('name', { ascending: true });

  throwSupabaseError('Gagal mengambil siswa kelas', error);
  return (data ?? []).map((row) => toStudent(row as StudentRow));
}

export async function getTeacherAttendance(params: { teacherId: string; scheduleId: string; date: string }) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return (
      mockTeacherAttendances.find(
        (attendance) =>
          attendance.teacherId === params.teacherId &&
          attendance.scheduleId === params.scheduleId &&
          attendance.date === params.date,
      ) ?? null
    );
  }

  const { data, error } = await supabase
    .from('teacher_attendances')
    .select('*')
    .eq('teacher_id', params.teacherId)
    .eq('schedule_id', params.scheduleId)
    .eq('date', params.date)
    .maybeSingle();

  throwSupabaseError('Gagal mengambil presensi guru', error);
  return data ? toTeacherAttendance(data as TeacherAttendanceRow) : null;
}

export async function createTeacherAttendance(attendance: TeacherAttendance) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    mockTeacherAttendances.unshift(attendance);
    return attendance;
  }

  const { data, error } = await supabase
    .from('teacher_attendances')
    .insert({
      id: attendance.id,
      teacher_id: attendance.teacherId,
      schedule_id: attendance.scheduleId,
      date: attendance.date,
      status: attendance.status,
      notes: attendance.notes,
    })
    .select()
    .single();

  throwSupabaseError('Gagal menyimpan presensi guru', error);
  return toTeacherAttendance(data as TeacherAttendanceRow);
}

export async function getStudentAttendance(params: { studentId: string; scheduleId: string; date: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return (
      mockStudentAttendances.find(
        (attendance) =>
          attendance.studentId === params.studentId &&
          attendance.scheduleId === params.scheduleId &&
          attendance.date === params.date,
      ) ?? null
    );
  }

  const { data, error } = await supabase
    .from('student_attendances')
    .select('*')
    .eq('student_id', params.studentId)
    .eq('schedule_id', params.scheduleId)
    .eq('date', params.date)
    .maybeSingle();

  throwSupabaseError('Gagal mengambil absensi siswa', error);
  return data ? toStudentAttendance(data as StudentAttendanceRow) : null;
}

export async function getStudentAttendancesForStudent(studentId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return mockStudentAttendances
      .filter((attendance) => attendance.studentId === studentId)
      .sort((first, second) => second.date.localeCompare(first.date));
  }

  const { data, error } = await supabase
    .from('student_attendances')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false });

  throwSupabaseError('Gagal mengambil riwayat absensi siswa', error);
  return (data ?? []).map((row) => toStudentAttendance(row as StudentAttendanceRow));
}

export async function saveStudentAttendances(attendances: StudentAttendance[]) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    attendances.forEach((attendance) => {
      const existingIndex = mockStudentAttendances.findIndex(
        (item) =>
          item.studentId === attendance.studentId &&
          item.scheduleId === attendance.scheduleId &&
          item.date === attendance.date,
      );

      if (existingIndex >= 0) {
        mockStudentAttendances[existingIndex] = attendance;
      } else {
        mockStudentAttendances.push(attendance);
      }
    });
    return attendances;
  }

  const saved: StudentAttendance[] = [];

  for (const attendance of attendances) {
    const existing = await getStudentAttendance({
      studentId: attendance.studentId,
      scheduleId: attendance.scheduleId,
      date: attendance.date,
    });

    if (existing) {
      const { data, error } = await supabase
        .from('student_attendances')
        .update({ status: attendance.status })
        .eq('id', existing.id)
        .select()
        .single();
      throwSupabaseError('Gagal memperbarui absensi siswa', error);
      saved.push(toStudentAttendance(data as StudentAttendanceRow));
    } else {
      const { data, error } = await supabase
        .from('student_attendances')
        .insert({
          id: attendance.id,
          student_id: attendance.studentId,
          schedule_id: attendance.scheduleId,
          date: attendance.date,
          status: attendance.status,
        })
        .select()
        .single();
      throwSupabaseError('Gagal menyimpan absensi siswa', error);
      saved.push(toStudentAttendance(data as StudentAttendanceRow));
    }
  }

  return saved;
}

export async function listTeacherAttendances() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [...mockTeacherAttendances];
  }

  const { data, error } = await supabase.from('teacher_attendances').select('*').order('date', { ascending: false });
  throwSupabaseError('Gagal mengambil laporan presensi guru', error);
  return (data ?? []).map((row) => toTeacherAttendance(row as TeacherAttendanceRow));
}

export async function listStudentAttendances() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [...mockStudentAttendances];
  }

  const { data, error } = await supabase.from('student_attendances').select('*').order('date', { ascending: false });
  throwSupabaseError('Gagal mengambil laporan absensi siswa', error);
  return (data ?? []).map((row) => toStudentAttendance(row as StudentAttendanceRow));
}

export async function getStudentAttendanceReportStudent(studentId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return mockStudents.find((student) => student.id === studentId) ?? null;
  }

  return getStudentById(studentId);
}

export async function listLearningMaterials() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [...mockLearningMaterials];
  }

  const { data, error } = await supabase.from('learning_materials').select('*').order('date', { ascending: false });
  throwSupabaseError('Gagal mengambil materi pembelajaran', error);
  return (data ?? []).map((row) => toLearningMaterial(row as LearningMaterialRow));
}

export async function getLearningMaterial(params: { scheduleId: string; date: string }) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return (
      mockLearningMaterials.find(
        (material) => material.scheduleId === params.scheduleId && material.date === params.date,
      ) ?? null
    );
  }

  const { data, error } = await supabase
    .from('learning_materials')
    .select('*')
    .eq('schedule_id', params.scheduleId)
    .eq('date', params.date)
    .maybeSingle();

  throwSupabaseError('Gagal mengambil materi pembelajaran', error);
  return data ? toLearningMaterial(data as LearningMaterialRow) : null;
}

export async function createLearningMaterial(material: LearningMaterial) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    mockLearningMaterials.unshift(material);
    return material;
  }

  const { data, error } = await supabase
    .from('learning_materials')
    .insert({
      id: material.id,
      teacher_id: material.teacherId,
      schedule_id: material.scheduleId,
      date: material.date,
      meeting: material.meeting,
      title: material.title,
      description: material.description,
      validation_status: material.validationStatus,
      alignment_status: material.alignmentStatus,
    })
    .select()
    .single();

  if (error?.message.includes('duplicate key')) {
    throw new RepositoryError('Materi untuk jadwal dan tanggal tersebut sudah tersedia.', 409);
  }

  throwSupabaseError('Gagal menyimpan materi pembelajaran', error);
  return toLearningMaterial(data as LearningMaterialRow);
}

async function getAssessmentQuestions(assessmentIds: string[]) {
  const supabase = getSupabaseAdmin();
  const questionMap = new Map<string, AssessmentQuestion[]>();

  if (!assessmentIds.length) {
    return questionMap;
  }

  if (!supabase) {
    mockAssessments.forEach((assessment) => {
      questionMap.set(assessment.id, assessment.questions);
    });
    return questionMap;
  }

  const { data, error } = await supabase
    .from('assessment_questions')
    .select('*')
    .in('assessment_id', assessmentIds)
    .order('position', { ascending: true });

  throwSupabaseError('Gagal mengambil soal assessment', error);

  (data ?? []).forEach((row) => {
    const questionRow = row as AssessmentQuestionRow;
    const current = questionMap.get(questionRow.assessment_id) ?? [];
    questionMap.set(questionRow.assessment_id, [...current, toAssessmentQuestion(questionRow)]);
  });

  return questionMap;
}

async function getAssessmentStudentAnswers(assessmentIds: string[]) {
  const supabase = getSupabaseAdmin();
  const answerMap = new Map<string, AssessmentStudentAnswer[]>();

  if (!assessmentIds.length) {
    return answerMap;
  }

  if (!supabase) {
    mockAssessments.forEach((assessment) => {
      assessment.studentStatuses.forEach((status) => {
        answerMap.set(`${assessment.id}:${status.studentId}`, status.answers ?? []);
      });
    });
    return answerMap;
  }

  const { data, error } = await supabase
    .from('assessment_student_answers')
    .select('*')
    .in('assessment_id', assessmentIds);

  if (isMissingSupabaseTable(error, 'assessment_student_answers')) {
    return answerMap;
  }

  throwSupabaseError('Gagal mengambil jawaban assessment siswa', error);

  (data ?? []).forEach((row) => {
    const answerRow = row as AssessmentStudentAnswerRow;
    const key = `${answerRow.assessment_id}:${answerRow.student_id}`;
    const current = answerMap.get(key) ?? [];
    answerMap.set(key, [...current, toAssessmentStudentAnswer(answerRow)]);
  });

  return answerMap;
}

async function getAssessmentStudentStatuses(assessmentIds: string[]) {
  const supabase = getSupabaseAdmin();
  const statusMap = new Map<string, AssessmentRecord['studentStatuses']>();

  if (!assessmentIds.length) {
    return statusMap;
  }

  const answerMap = await getAssessmentStudentAnswers(assessmentIds);

  if (!supabase) {
    mockAssessments.forEach((assessment) => {
      statusMap.set(assessment.id, assessment.studentStatuses);
    });
    return statusMap;
  }

  const { data, error } = await supabase
    .from('assessment_student_statuses')
    .select('*')
    .in('assessment_id', assessmentIds);

  throwSupabaseError('Gagal mengambil status assessment siswa', error);

  (data ?? []).forEach((row) => {
    const statusRow = row as AssessmentStudentStatusRow;
    const answers = answerMap.get(`${statusRow.assessment_id}:${statusRow.student_id}`) ?? [];
    const current = statusMap.get(statusRow.assessment_id) ?? [];
    statusMap.set(statusRow.assessment_id, [
      ...current,
      {
        studentId: statusRow.student_id,
        completed: statusRow.completed,
        completedAt: statusRow.completed_at ?? undefined,
        score:
          answers.length > 0
            ? answers.filter((answer) => answer.correct).length
            : typeof statusRow.score === 'number'
              ? statusRow.score
              : undefined,
        answers,
      },
    ]);
  });

  return statusMap;
}

async function hydrateAssessments(rows: AssessmentRow[]) {
  const assessmentIds = rows.map((row) => row.id);
  const [questionMap, statusMap] = await Promise.all([
    getAssessmentQuestions(assessmentIds),
    getAssessmentStudentStatuses(assessmentIds),
  ]);

  return rows.map((row) =>
    toAssessment(row, questionMap.get(row.id) ?? [], statusMap.get(row.id) ?? []),
  );
}

export async function listAssessments() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [...mockAssessments];
  }

  const { data, error } = await supabase.from('assessments').select('*').order('date', { ascending: false });
  throwSupabaseError('Gagal mengambil assessment', error);
  return hydrateAssessments((data ?? []) as AssessmentRow[]);
}

export async function getAssessmentById(assessmentId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return mockAssessments.find((assessment) => assessment.id === assessmentId) ?? null;
  }

  const { data, error } = await supabase.from('assessments').select('*').eq('id', assessmentId).maybeSingle();
  throwSupabaseError('Gagal mengambil assessment', error);

  if (!data) {
    return null;
  }

  const [assessment] = await hydrateAssessments([data as AssessmentRow]);
  return assessment ?? null;
}

export async function getAssessment(params: {
  type: AssessmentRecord['type'];
  scheduleId: string;
  date: string;
  meeting: number;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return (
      mockAssessments.find(
        (assessment) =>
          assessment.type === params.type &&
          assessment.scheduleId === params.scheduleId &&
          assessment.date === params.date &&
          assessment.meeting === params.meeting,
      ) ?? null
    );
  }

  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('type', params.type)
    .eq('schedule_id', params.scheduleId)
    .eq('date', params.date)
    .eq('meeting', params.meeting)
    .maybeSingle();

  throwSupabaseError('Gagal mengambil assessment', error);

  if (!data) {
    return null;
  }

  const [assessment] = await hydrateAssessments([data as AssessmentRow]);
  return assessment ?? null;
}

export async function createAssessments(assessments: AssessmentRecord[]) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    mockAssessments.unshift(...assessments);
    return assessments;
  }

  const saved: AssessmentRecord[] = [];

  for (const assessment of assessments) {
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        id: assessment.id,
        type: assessment.type,
        teacher_id: assessment.teacherId,
        schedule_id: assessment.scheduleId,
        class_id: assessment.classId,
        subject_id: assessment.subjectId,
        date: assessment.date,
        meeting: assessment.meeting,
        question_count: assessment.questionCount,
        status: assessment.status,
      })
      .select()
      .single();

    if (error?.message.includes('duplicate key')) {
      throw new RepositoryError('Assessment untuk pertemuan ini sudah tersedia.', 409);
    }

    throwSupabaseError('Gagal menyimpan assessment', error);

    const questionRows = assessment.questions.map((question, index) => ({
      id: question.id,
      assessment_id: assessment.id,
      question: question.question,
      options: question.options,
      answer: question.answer,
      position: index + 1,
    }));

    const statusRows = assessment.studentStatuses.map((status) => ({
      assessment_id: assessment.id,
      student_id: status.studentId,
      completed: status.completed,
      completed_at: status.completed ? new Date().toISOString() : null,
      score: status.score ?? 0,
    }));

    if (questionRows.length) {
      const { error: questionError } = await supabase.from('assessment_questions').insert(questionRows);
      throwSupabaseError('Gagal menyimpan soal assessment', questionError);
    }

    if (statusRows.length) {
      const { error: statusError } = await supabase.from('assessment_student_statuses').insert(statusRows);
      throwSupabaseError('Gagal menyimpan status assessment siswa', statusError);
    }

    saved.push(toAssessment(data as AssessmentRow, assessment.questions, assessment.studentStatuses));
  }

  return saved;
}

function normalizeAssessmentAnswer(value: string) {
  return value.trim();
}

function buildStudentAssessmentAnswers(assessment: AssessmentRecord, answers: AssessmentAnswerInput[]) {
  const answerMap = new Map(answers.map((item) => [item.questionId, normalizeAssessmentAnswer(item.answer)]));

  return assessment.questions.map((question) => {
    const selectedAnswer = answerMap.get(question.id) ?? '';
    const correctAnswer = normalizeAssessmentAnswer(question.answer);
    return {
      questionId: question.id,
      answer: selectedAnswer,
      correct: selectedAnswer === correctAnswer,
    };
  });
}

export async function completeAssessmentForStudent(
  assessmentId: string,
  studentId: string,
  answers: AssessmentAnswerInput[],
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const assessment = mockAssessments.find((item) => item.id === assessmentId);
    if (!assessment) {
      return null;
    }

    const studentAnswers = buildStudentAssessmentAnswers(assessment, answers);
    const completedAt = new Date().toISOString();

    assessment.studentStatuses = assessment.studentStatuses.map((status) =>
      status.studentId === studentId
        ? {
            ...status,
            completed: true,
            completedAt,
            score: studentAnswers.filter((answer) => answer.correct).length,
            answers: studentAnswers,
          }
        : status,
    );
    return assessment;
  }

  const assessment = await getAssessmentById(assessmentId);
  if (!assessment) {
    return null;
  }

  const studentAnswers = buildStudentAssessmentAnswers(assessment, answers);
  const score = studentAnswers.filter((answer) => answer.correct).length;

  const { error } = await supabase
    .from('assessment_student_statuses')
    .update({ completed: true, completed_at: new Date().toISOString(), score })
    .eq('assessment_id', assessmentId)
    .eq('student_id', studentId);

  if (isMissingSupabaseColumn(error, 'score')) {
    const { error: fallbackError } = await supabase
      .from('assessment_student_statuses')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('assessment_id', assessmentId)
      .eq('student_id', studentId);

    throwSupabaseError('Gagal memperbarui status assessment siswa', fallbackError);
  } else {
    throwSupabaseError('Gagal memperbarui status assessment siswa', error);
  }

  const { error: deleteAnswerError } = await supabase
    .from('assessment_student_answers')
    .delete()
    .eq('assessment_id', assessmentId)
    .eq('student_id', studentId);

  if (isMissingSupabaseTable(deleteAnswerError, 'assessment_student_answers')) {
    return getAssessmentById(assessmentId);
  }

  throwSupabaseError('Gagal memperbarui jawaban assessment siswa', deleteAnswerError);

  if (studentAnswers.length > 0) {
    const { error: insertAnswerError } = await supabase.from('assessment_student_answers').insert(
      studentAnswers.map((answer) => ({
        assessment_id: assessmentId,
        student_id: studentId,
        question_id: answer.questionId,
        answer: answer.answer,
        correct: answer.correct,
      })),
    );

    throwSupabaseError('Gagal menyimpan jawaban assessment siswa', insertAnswerError);
  }

  return getAssessmentById(assessmentId);
}

export async function listTeacherQuestionnaires() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [...mockQuestionnaires];
  }

  const { data, error } = await supabase
    .from('teacher_questionnaires')
    .select('*')
    .order('date', { ascending: false });

  throwSupabaseError('Gagal mengambil kuisioner guru', error);
  return (data ?? []).map((row) => toTeacherQuestionnaire(row as TeacherQuestionnaireRow));
}

export async function getTeacherQuestionnaire(params: {
  studentId: string;
  teacherId: string;
  scheduleId: string;
  date: string;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return (
      mockQuestionnaires.find(
        (questionnaire) =>
          questionnaire.studentId === params.studentId &&
          questionnaire.teacherId === params.teacherId &&
          questionnaire.scheduleId === params.scheduleId &&
          questionnaire.date === params.date,
      ) ?? null
    );
  }

  const { data, error } = await supabase
    .from('teacher_questionnaires')
    .select('*')
    .eq('student_id', params.studentId)
    .eq('teacher_id', params.teacherId)
    .eq('schedule_id', params.scheduleId)
    .eq('date', params.date)
    .maybeSingle();

  throwSupabaseError('Gagal mengambil kuisioner guru', error);
  return data ? toTeacherQuestionnaire(data as TeacherQuestionnaireRow) : null;
}

export async function completeTeacherQuestionnaire(questionnaire: TeacherQuestionnaire) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const existingIndex = mockQuestionnaires.findIndex(
      (item) =>
        item.studentId === questionnaire.studentId &&
        item.teacherId === questionnaire.teacherId &&
        item.scheduleId === questionnaire.scheduleId &&
        item.date === questionnaire.date,
    );

    if (existingIndex >= 0) {
      mockQuestionnaires[existingIndex] = {
        ...mockQuestionnaires[existingIndex],
        completed: true,
        ratings: questionnaire.ratings,
        note: questionnaire.note ?? '',
      };
      return mockQuestionnaires[existingIndex];
    }

    mockQuestionnaires.unshift(questionnaire);
    return questionnaire;
  }

  const existing = await getTeacherQuestionnaire({
    studentId: questionnaire.studentId,
    teacherId: questionnaire.teacherId,
    scheduleId: questionnaire.scheduleId,
    date: questionnaire.date,
  });

  if (existing) {
    const { data, error } = await supabase
      .from('teacher_questionnaires')
      .update({ completed: true, ratings: questionnaire.ratings ?? {}, note: questionnaire.note ?? '' })
      .eq('id', existing.id)
      .select()
      .single();

    if (isMissingSupabaseColumn(error, 'ratings') || isMissingSupabaseColumn(error, 'note')) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('teacher_questionnaires')
        .update({ completed: true })
        .eq('id', existing.id)
        .select()
        .single();

      throwSupabaseError('Gagal memperbarui kuisioner guru', fallbackError);
      return {
        ...toTeacherQuestionnaire(fallbackData as TeacherQuestionnaireRow),
        ratings: questionnaire.ratings,
        note: questionnaire.note ?? '',
      };
    }

    throwSupabaseError('Gagal memperbarui kuisioner guru', error);
    return toTeacherQuestionnaire(data as TeacherQuestionnaireRow);
  }

  const { data, error } = await supabase
    .from('teacher_questionnaires')
    .insert({
      id: questionnaire.id,
      student_id: questionnaire.studentId,
      teacher_id: questionnaire.teacherId,
      schedule_id: questionnaire.scheduleId,
      date: questionnaire.date,
      completed: true,
      ratings: questionnaire.ratings ?? {},
      note: questionnaire.note ?? '',
    })
    .select()
    .single();

  if (isMissingSupabaseColumn(error, 'ratings') || isMissingSupabaseColumn(error, 'note')) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('teacher_questionnaires')
      .insert({
        id: questionnaire.id,
        student_id: questionnaire.studentId,
        teacher_id: questionnaire.teacherId,
        schedule_id: questionnaire.scheduleId,
        date: questionnaire.date,
        completed: true,
      })
      .select()
      .single();

    throwSupabaseError('Gagal menyimpan kuisioner guru', fallbackError);
    return {
      ...toTeacherQuestionnaire(fallbackData as TeacherQuestionnaireRow),
      ratings: questionnaire.ratings,
      note: questionnaire.note ?? '',
    };
  }

  throwSupabaseError('Gagal menyimpan kuisioner guru', error);
  return toTeacherQuestionnaire(data as TeacherQuestionnaireRow);
}

export async function listStudentJournals() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [...mockStudentJournals];
  }

  const { data, error } = await supabase.from('student_journals').select('*').order('date', { ascending: false });
  throwSupabaseError('Gagal mengambil jurnal siswa', error);
  return (data ?? []).map((row) => toStudentJournal(row as StudentJournalRow));
}

export async function getStudentJournal(params: { studentId: string; scheduleId: string; date: string }) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return (
      mockStudentJournals.find(
        (journal) =>
          journal.studentId === params.studentId &&
          journal.scheduleId === params.scheduleId &&
          journal.date === params.date,
      ) ?? null
    );
  }

  const { data, error } = await supabase
    .from('student_journals')
    .select('*')
    .eq('student_id', params.studentId)
    .eq('schedule_id', params.scheduleId)
    .eq('date', params.date)
    .maybeSingle();

  throwSupabaseError('Gagal mengambil jurnal siswa', error);
  return data ? toStudentJournal(data as StudentJournalRow) : null;
}

export async function createStudentJournal(journal: StudentJournal) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    mockStudentJournals.unshift(journal);
    return journal;
  }

  const { data, error } = await supabase
    .from('student_journals')
    .insert({
      id: journal.id,
      student_id: journal.studentId,
      schedule_id: journal.scheduleId,
      date: journal.date,
      material_studied: journal.materialStudied,
      summary: journal.summary,
      tasks: journal.tasks,
      learning_obstacles: journal.learningObstacles,
      attachment_name: journal.attachmentName,
      entry_status: journal.entryStatus,
      review_status: journal.reviewStatus,
      notes: journal.notes,
      validation_status: journal.validationStatus,
    })
    .select()
    .single();

  if (error?.message.includes('duplicate key')) {
    throw new RepositoryError('Jurnal sudah pernah diisi untuk tanggal dan mata pelajaran yang sama.', 409);
  }

  throwSupabaseError('Gagal menyimpan jurnal siswa', error);
  return toStudentJournal(data as StudentJournalRow);
}

export async function updateLearningMaterialValidation(
  materialId: string,
  status: LearningMaterial['validationStatus'],
) {
  const alignmentStatus: LearningMaterial['alignmentStatus'] = status === 'Valid' ? 'Sesuai' : 'Perlu Cek';
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const materialIndex = mockLearningMaterials.findIndex((material) => material.id === materialId);
    if (materialIndex < 0) {
      throw new RepositoryError('Materi pembelajaran tidak ditemukan.', 404);
    }

    mockLearningMaterials[materialIndex] = {
      ...mockLearningMaterials[materialIndex],
      validationStatus: status,
      alignmentStatus,
    };
    return mockLearningMaterials[materialIndex];
  }

  const { data, error } = await supabase
    .from('learning_materials')
    .update({
      validation_status: status,
      alignment_status: alignmentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', materialId)
    .select()
    .single();

  throwSupabaseError('Gagal memperbarui validasi materi', error);
  return toLearningMaterial(data as LearningMaterialRow);
}

export async function updateStudentJournalValidation(
  journalId: string,
  status: StudentJournal['validationStatus'],
) {
  const reviewStatus: StudentJournal['reviewStatus'] = status === 'Valid' ? 'Tervalidasi' : 'Perlu Revisi';
  const notes =
    status === 'Valid'
      ? 'Jurnal tervalidasi oleh kurikulum.'
      : 'Jurnal ditolak. Perlu pembaruan isi dan kesesuaian materi.';
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const journalIndex = mockStudentJournals.findIndex((journal) => journal.id === journalId);
    if (journalIndex < 0) {
      throw new RepositoryError('Jurnal siswa tidak ditemukan.', 404);
    }

    mockStudentJournals[journalIndex] = {
      ...mockStudentJournals[journalIndex],
      validationStatus: status,
      reviewStatus,
      notes,
    };
    return mockStudentJournals[journalIndex];
  }

  const { data, error } = await supabase
    .from('student_journals')
    .update({
      validation_status: status,
      review_status: reviewStatus,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', journalId)
    .select()
    .single();

  throwSupabaseError('Gagal memperbarui validasi jurnal siswa', error);
  return toStudentJournal(data as StudentJournalRow);
}

export async function deleteMasterData(kind: 'student' | 'teacher' | 'class' | 'subject' | 'schedule', id: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  const targetId = id.trim();
  if (!targetId) {
    throw new RepositoryError('ID data tidak valid.', 422);
  }

  try {
    if (kind === 'student') {
      await supabase.from('app_users').delete().eq('role', 'siswa').eq('reference_id', targetId);
      const { error } = await supabase.from('students').delete().eq('id', targetId);
      throwSupabaseError('Gagal menghapus siswa', error);
      return;
    }

    if (kind === 'teacher') {
      await supabase.from('app_users').delete().eq('role', 'guru').eq('reference_id', targetId);
      const { error } = await supabase.from('teachers').delete().eq('id', targetId);
      throwSupabaseError('Gagal menghapus guru', error);
      return;
    }

    if (kind === 'class') {
      const { error } = await supabase.from('classes').delete().eq('id', targetId);
      throwSupabaseError('Gagal menghapus kelas', error);
      return;
    }

    if (kind === 'subject') {
      const { error } = await supabase.from('subjects').delete().eq('id', targetId);
      throwSupabaseError('Gagal menghapus mapel', error);
      return;
    }

    const { error } = await supabase.from('schedules').delete().eq('id', targetId);
    throwSupabaseError('Gagal menghapus jadwal', error);
  } catch (error) {
    if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
      throw new RepositoryError('Data tidak bisa dihapus karena masih dipakai oleh data lain.', 409);
    }

    throw error;
  }
}
