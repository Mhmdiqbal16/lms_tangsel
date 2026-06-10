import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { initialAppDataState, mockData } from '@/data/mockData';
import { apiRequest } from '@/lib/apiClient';
import {
  AdminProfile,
  AppDataState,
  AssessmentQuestion,
  AssessmentRecord,
  ClassRoom,
  LearningMaterial,
  Permission,
  Schedule,
  StudentAttendance,
  StudentAttendanceStatus,
  StudentJournal,
  StudentProfile,
  Subject,
  TeacherAttendance,
  TeacherQuestionnaire,
  TeacherProfile,
  User,
  ValidationStatus,
} from '@/types';
import {
  APP_DATA_STORAGE_KEY,
  ensureManualDataReset,
  normalizeAppState,
  readStoredAppState,
} from '@/utils/appStateStorage';
import { createId, getInitials } from '@/utils/helpers';
import { isTeacherAttendanceDuplicate, isTeacherScheduleAllowed } from '@/utils/businessRules';

interface ActionResult {
  success: boolean;
  message: string;
}

interface AddJournalPayload {
  studentId: string;
  scheduleId: string;
  date: string;
  materialStudied: string;
  summary: string;
  tasks: string;
  learningObstacles: string;
  attachmentName: string;
}

interface AddTeacherAttendancePayload {
  teacherId: string;
  scheduleId: string;
  date: string;
  status: TeacherAttendance['status'];
  notes: string;
}

interface SaveStudentAttendancesPayload {
  teacherId: string;
  scheduleId: string;
  date: string;
  attendances: Array<{
    studentId: string;
    status: StudentAttendanceStatus;
  }>;
}

interface AddLearningMaterialPayload {
  teacherId: string;
  scheduleId: string;
  date: string;
  meeting: number;
  title: string;
  description: string;
}

type AssessmentQuestionInput = Pick<AssessmentQuestion, 'question' | 'options' | 'answer'>;

interface AddAssessmentBundlePayload {
  teacherId: string;
  scheduleId: string;
  date: string;
  classId: string;
  subjectId: string;
  meeting: number;
  status: AssessmentRecord['status'];
  pretestQuestions: AssessmentQuestionInput[];
  posttestQuestions: AssessmentQuestionInput[];
}

interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

interface UpdateStudentAccountPayload {
  studentId: string;
  name: string;
  email: string;
  avatar: string;
}

interface UpdateTeacherProfilePayload {
  teacherId: string;
  name: string;
  email: string;
  subjectIds: string[];
}

interface SaveStudentPayload {
  id?: string;
  name: string;
  nisn: string;
  classId: string;
  email: string;
  avatar: string;
}

interface SaveTeacherPayload {
  id?: string;
  name: string;
  nip: string;
  email: string;
  subjectIds: string[];
}

interface SaveClassPayload {
  id?: string;
  name: string;
  major: string;
  homeroomTeacherId: string;
}

interface SaveSubjectPayload {
  id?: string;
  name: string;
  shortName: string;
}

interface SaveSchedulePayload {
  id?: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  day: number;
  startTime: string;
  endTime: string;
  room: string;
}

type MasterDataKind = 'student' | 'teacher' | 'class' | 'subject' | 'schedule';

interface AppDataContextValue extends AppDataState {
  students: typeof mockData.students;
  teachers: typeof mockData.teachers;
  curricula: typeof mockData.curricula;
  admins: typeof mockData.admins;
  classes: typeof mockData.classes;
  subjects: typeof mockData.subjects;
  schedules: typeof mockData.schedules;
  studentAttendances: typeof mockData.studentAttendances;
  notifications: typeof mockData.notifications;
  reportSummary: typeof mockData.reportSummary;
  addStudentJournal: (payload: AddJournalPayload) => ActionResult;
  addTeacherAttendance: (payload: AddTeacherAttendancePayload) => ActionResult;
  saveStudentAttendances: (payload: SaveStudentAttendancesPayload) => ActionResult;
  addLearningMaterial: (payload: AddLearningMaterialPayload) => ActionResult;
  addAssessmentBundle: (payload: AddAssessmentBundlePayload) => ActionResult;
  completeAssessment: (assessmentId: string, studentId: string) => void;
  completeQuestionnaire: (payload: {
    studentId: string;
    teacherId: string;
    scheduleId: string;
    date: string;
  }) => void;
  setJournalValidation: (journalId: string, status: ValidationStatus) => void;
  setMaterialValidation: (materialId: string, status: ValidationStatus) => void;
  updateOwnPassword: (payload: UpdatePasswordPayload) => ActionResult;
  updateStudentAccount: (payload: UpdateStudentAccountPayload) => ActionResult;
  updateTeacherProfile: (payload: UpdateTeacherProfilePayload) => ActionResult;
  saveStudentByAdmin: (payload: SaveStudentPayload) => ActionResult;
  saveTeacherByAdmin: (payload: SaveTeacherPayload) => ActionResult;
  saveClassByAdmin: (payload: SaveClassPayload) => ActionResult;
  saveSubjectByAdmin: (payload: SaveSubjectPayload) => ActionResult;
  saveScheduleByAdmin: (payload: SaveSchedulePayload) => ActionResult;
  deleteMasterData: (kind: MasterDataKind, id: string) => ActionResult;
  resetData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);
const MAX_ASSESSMENT_QUESTIONS = 10;

function normalizeAssessmentQuestions(label: string, questions: AssessmentQuestionInput[]): AssessmentQuestion[] {
  return questions.map((item, index) => ({
    id: createId(`${label.toLowerCase()}-${index + 1}`),
    question: item.question.trim(),
    options: item.options.map((option) => option.trim()),
    answer: item.answer.trim(),
  }));
}

function getAssessmentQuestionError(label: string, questions: AssessmentQuestionInput[]) {
  if (questions.length === 0) {
    return `${label} minimal memiliki 1 soal pilihan ganda.`;
  }

  if (questions.length > MAX_ASSESSMENT_QUESTIONS) {
    return `${label} maksimal berisi ${MAX_ASSESSMENT_QUESTIONS} soal.`;
  }

  const invalidIndex = questions.findIndex((item) => {
    const options = item.options.map((option) => option.trim());
    return (
      !item.question.trim() ||
      options.length !== 4 ||
      options.some((option) => !option) ||
      !options.includes(item.answer.trim())
    );
  });

  if (invalidIndex >= 0) {
    return `${label} nomor ${invalidIndex + 1} belum lengkap. Isi pertanyaan, 4 opsi, dan kunci jawaban.`;
  }

  return null;
}

function upsertById<T extends { id: string }>(items: T[], nextItem: T) {
  return items.some((item) => item.id === nextItem.id)
    ? items.map((item) => (item.id === nextItem.id ? nextItem : item))
    : [nextItem, ...items];
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeAvatar(value: string, name: string) {
  return (value.trim() || getInitials(name) || 'NA').slice(0, 3).toUpperCase();
}

function findProfileUser(users: User[], role: User['role'], referenceId: string, userId?: string) {
  return users.find((user) => user.id === userId) ?? users.find((user) => user.role === role && user.referenceId === referenceId);
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { session, hasPermission, updateSessionProfile } = useAuthContext();
  const [state, setState] = useState<AppDataState>(() => readStoredAppState());

  useEffect(() => {
    if (ensureManualDataReset()) {
      setState(initialAppDataState);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    let isMounted = true;

    apiRequest<Partial<AppDataState>>('/api/app-data')
      .then((data) => {
        if (isMounted) {
          setState(normalizeAppState(data));
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [session?.userId]);

  useEffect(() => {
    window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const getAccessError = (permission: Permission, message: string) => {
    if (!session || !hasPermission(permission)) {
      return {
        success: false,
        message,
      } satisfies ActionResult;
    }

    return null;
  };

  const getMasterDataAccessError = () =>
    getAccessError('master.data.manage', 'Akun aktif tidak memiliki akses mengelola data master.');

  const syncActiveSession = (referenceId: string, name: string, identifier?: string) => {
    if (session?.referenceId !== referenceId) {
      return;
    }

    updateSessionProfile(identifier ? { name, identifier } : { name });
  };

  const value: AppDataContextValue = {
    ...state,
    users: state.users,
    students: state.students,
    teachers: state.teachers,
    curricula: state.curricula,
    admins: state.admins,
    classes: state.classes,
    subjects: state.subjects,
    schedules: state.schedules,
    studentAttendances: state.studentAttendances,
    notifications: mockData.notifications,
    reportSummary: {
      totalTeachers: state.teachers.length,
      totalStudents: state.students.length,
      totalClasses: state.classes.length,
      totalSubjects: state.subjects.length,
      totalJournals: state.studentJournals.length,
      totalTeacherAttendances: state.teacherAttendances.length,
    },
    addStudentJournal: (payload) => {
      const accessError = getAccessError('student.journal.create', 'Akun aktif tidak memiliki akses mengisi jurnal.');
      if (accessError) {
        return accessError;
      }

      if (!session || session.role !== 'siswa' || session.referenceId !== payload.studentId) {
        return {
          success: false,
          message: 'Siswa hanya dapat mengisi jurnal untuk akun miliknya sendiri.',
        };
      }

      const duplicate = state.studentJournals.some(
        (item) =>
          item.studentId === payload.studentId && item.scheduleId === payload.scheduleId && item.date === payload.date,
      );

      if (duplicate) {
        return {
          success: false,
          message: 'Jurnal sudah pernah diisi untuk tanggal dan mata pelajaran yang sama.',
        };
      }

      const nextJournal: StudentJournal = {
        id: createId('jur'),
        ...payload,
        entryStatus: 'Selesai',
        reviewStatus: 'Menunggu Review',
        notes: 'Menunggu review guru.',
        validationStatus: 'Menunggu',
      };

      setState((current) => ({
        ...current,
        studentJournals: [nextJournal, ...current.studentJournals],
      }));

      return {
        success: true,
        message: 'Jurnal berhasil disimpan.',
      };
    },
    addTeacherAttendance: (payload) => {
      const accessError = getAccessError(
        'teacher.attendance.create',
        'Akun aktif tidak memiliki akses mengisi presensi guru.',
      );
      if (accessError) {
        return accessError;
      }

      if (!session || session.role !== 'guru' || session.referenceId !== payload.teacherId) {
        return {
          success: false,
          message: 'Guru hanya dapat mengisi presensi untuk akun guru yang sedang login.',
        };
      }

      if (!isTeacherScheduleAllowed(state.schedules, payload.teacherId, payload.scheduleId, payload.date)) {
        return {
          success: false,
          message: 'Presensi hanya dapat dibuat sesuai jadwal mengajar guru.',
        };
      }

      if (
        isTeacherAttendanceDuplicate(state.teacherAttendances, payload.teacherId, payload.scheduleId, payload.date)
      ) {
        return {
          success: false,
          message: 'Presensi untuk jadwal ini sudah pernah diinput.',
        };
      }

      const nextAttendance: TeacherAttendance = {
        id: createId('pres'),
        ...payload,
      };

      setState((current) => ({
        ...current,
        teacherAttendances: [nextAttendance, ...current.teacherAttendances],
      }));

      return {
        success: true,
        message: 'Presensi mengajar berhasil disimpan.',
      };
    },
    saveStudentAttendances: (payload) => {
      const accessError = getAccessError(
        'student.attendance.manage_taught_classes',
        'Akun aktif tidak memiliki akses mengelola absensi siswa.',
      );
      if (accessError) {
        return accessError;
      }

      if (!session || session.role !== 'guru' || session.referenceId !== payload.teacherId) {
        return {
          success: false,
          message: 'Guru hanya dapat mengelola absensi siswa untuk akun guru yang sedang login.',
        };
      }

      const schedule = state.schedules.find((item) => item.id === payload.scheduleId);

      if (!schedule || schedule.teacherId !== payload.teacherId) {
        return {
          success: false,
          message: 'Absensi siswa hanya dapat diisi untuk jadwal guru sendiri.',
        };
      }

      if (!isTeacherScheduleAllowed(state.schedules, payload.teacherId, payload.scheduleId, payload.date)) {
        return {
          success: false,
          message: 'Absensi siswa hanya dapat diisi sesuai jadwal mengajar guru.',
        };
      }

      const teacherAttendance = state.teacherAttendances.find(
        (item) =>
          item.teacherId === payload.teacherId && item.scheduleId === payload.scheduleId && item.date === payload.date,
      );

      if (!teacherAttendance) {
        return {
          success: false,
          message: 'Isi presensi guru terlebih dahulu sebelum menyimpan absensi siswa.',
        };
      }

      if (teacherAttendance.status !== 'Hadir') {
        return {
          success: false,
          message: 'Absensi siswa hanya dapat diisi ketika presensi guru berstatus hadir.',
        };
      }

      const classStudentIds = new Set(
        state.students.filter((item) => item.classId === schedule.classId).map((item) => item.id),
      );

      if (!payload.attendances.length) {
        return {
          success: false,
          message: 'Belum ada data siswa yang dikirim untuk disimpan.',
        };
      }

      if (payload.attendances.some((item) => !classStudentIds.has(item.studentId))) {
        return {
          success: false,
          message: 'Terdapat siswa yang tidak sesuai dengan kelas pada jadwal terpilih.',
        };
      }

      setState((current) => {
        const nextAttendances = [...current.studentAttendances];

        payload.attendances.forEach((attendance) => {
          const existingIndex = nextAttendances.findIndex(
            (item) =>
              item.studentId === attendance.studentId &&
              item.scheduleId === payload.scheduleId &&
              item.date === payload.date,
          );

          if (existingIndex >= 0) {
            nextAttendances[existingIndex] = {
              ...nextAttendances[existingIndex],
              status: attendance.status,
            };
            return;
          }

          nextAttendances.unshift({
            id: createId('atts'),
            studentId: attendance.studentId,
            scheduleId: payload.scheduleId,
            date: payload.date,
            status: attendance.status,
          } satisfies StudentAttendance);
        });

        return {
          ...current,
          studentAttendances: nextAttendances,
        };
      });

      return {
        success: true,
        message: 'Absensi siswa berhasil disimpan.',
      };
    },
    addLearningMaterial: (payload) => {
      const accessError = getAccessError(
        'learning.material.create',
        'Akun aktif tidak memiliki akses menginput materi pembelajaran.',
      );
      if (accessError) {
        return accessError;
      }

      if (!session || session.role !== 'guru' || session.referenceId !== payload.teacherId) {
        return {
          success: false,
          message: 'Guru hanya dapat menginput materi untuk jadwal mengajarnya sendiri.',
        };
      }

      if (!isTeacherScheduleAllowed(state.schedules, payload.teacherId, payload.scheduleId, payload.date)) {
        return {
          success: false,
          message: 'Materi hanya dapat diinput sesuai jadwal guru.',
        };
      }

      const duplicate = state.learningMaterials.some(
        (item) => item.scheduleId === payload.scheduleId && item.date === payload.date,
      );

      if (duplicate) {
        return {
          success: false,
          message: 'Materi untuk jadwal dan tanggal tersebut sudah tersedia.',
        };
      }

      setState((current) => ({
        ...current,
        learningMaterials: [
          {
            id: createId('mat'),
            ...payload,
            validationStatus: 'Menunggu',
            alignmentStatus: 'Sesuai',
          },
          ...current.learningMaterials,
        ],
      }));

      return {
        success: true,
        message: 'Materi pembelajaran berhasil disimpan.',
      };
    },
    addAssessmentBundle: (payload) => {
      const accessError = getAccessError(
        'assessment.manage',
        'Akun aktif tidak memiliki akses membuat pretest dan posttest.',
      );
      if (accessError) {
        return accessError;
      }

      if (!session || session.role !== 'guru' || session.referenceId !== payload.teacherId) {
        return {
          success: false,
          message: 'Guru hanya dapat membuat assessment untuk jadwal mengajarnya sendiri.',
        };
      }

      const schedule = state.schedules.find((item) => item.id === payload.scheduleId);

      if (!schedule || schedule.teacherId !== payload.teacherId) {
        return {
          success: false,
          message: 'Pretest dan posttest hanya bisa dibuat untuk jadwal guru sendiri.',
        };
      }

      const duplicate = state.assessments.some(
        (item) =>
          item.scheduleId === payload.scheduleId && item.date === payload.date && item.meeting === payload.meeting,
      );

      if (duplicate) {
        return {
          success: false,
          message: 'Assessment untuk pertemuan ini sudah tersedia.',
        };
      }

      const questionError =
        getAssessmentQuestionError('Pretest', payload.pretestQuestions) ??
        getAssessmentQuestionError('Posttest', payload.posttestQuestions);

      if (questionError) {
        return {
          success: false,
          message: questionError,
        };
      }

      const classStudents = state.students.filter((item) => item.classId === payload.classId);
      const pretestQuestions = normalizeAssessmentQuestions('Pretest', payload.pretestQuestions);
      const posttestQuestions = normalizeAssessmentQuestions('Posttest', payload.posttestQuestions);

      const buildStudentStatuses = () =>
        classStudents.map((item) => ({
          studentId: item.id,
          completed: false,
        }));

      const pretest: AssessmentRecord = {
        id: createId('asm-pre'),
        type: 'pretest',
        teacherId: payload.teacherId,
        scheduleId: payload.scheduleId,
        classId: payload.classId,
        subjectId: payload.subjectId,
        date: payload.date,
        meeting: payload.meeting,
        questionCount: pretestQuestions.length,
        status: payload.status,
        questions: pretestQuestions,
        studentStatuses: buildStudentStatuses(),
      };

      const posttest: AssessmentRecord = {
        id: createId('asm-post'),
        type: 'posttest',
        teacherId: payload.teacherId,
        scheduleId: payload.scheduleId,
        classId: payload.classId,
        subjectId: payload.subjectId,
        date: payload.date,
        meeting: payload.meeting,
        questionCount: posttestQuestions.length,
        status: payload.status,
        questions: posttestQuestions,
        studentStatuses: buildStudentStatuses(),
      };

      setState((current) => ({
        ...current,
        assessments: [pretest, posttest, ...current.assessments],
      }));

      return {
        success: true,
        message: 'Paket pretest dan posttest berhasil dibuat.',
      };
    },
    completeAssessment: (assessmentId, studentId) => {
      if (!session || session.role !== 'siswa' || session.referenceId !== studentId) {
        return;
      }

      setState((current) => ({
        ...current,
        assessments: current.assessments.map((assessment) =>
          assessment.id !== assessmentId
            ? assessment
            : {
                ...assessment,
                studentStatuses: assessment.studentStatuses.map((status) =>
                  status.studentId === studentId ? { ...status, completed: true } : status,
                ),
              },
        ),
      }));
    },
    completeQuestionnaire: ({ studentId, teacherId, scheduleId, date }) => {
      if (!session || session.role !== 'siswa' || session.referenceId !== studentId) {
        return;
      }

      const existing = state.questionnaires.find(
        (item) =>
          item.studentId === studentId &&
          item.teacherId === teacherId &&
          item.scheduleId === scheduleId &&
          item.date === date,
      );

      if (existing) {
        setState((current) => ({
          ...current,
          questionnaires: current.questionnaires.map((item) =>
            item.id === existing.id ? { ...item, completed: true } : item,
          ),
        }));
        return;
      }

      const questionnaire: TeacherQuestionnaire = {
        id: createId('kui'),
        studentId,
        teacherId,
        scheduleId,
        date,
        completed: true,
      };

      setState((current) => ({
        ...current,
        questionnaires: [questionnaire, ...current.questionnaires],
      }));
    },
    setJournalValidation: (journalId, status) => {
      if (!session || !hasPermission('validation.manage')) {
        return;
      }

      setState((current) => ({
        ...current,
        studentJournals: current.studentJournals.map((journal) =>
          journal.id !== journalId
            ? journal
            : {
                ...journal,
                validationStatus: status,
                reviewStatus: status === 'Valid' ? 'Tervalidasi' : 'Perlu Revisi',
                notes:
                  status === 'Valid'
                    ? 'Jurnal tervalidasi oleh kurikulum.'
                    : 'Jurnal ditolak. Perlu pembaruan isi dan kesesuaian materi.',
              },
        ),
      }));
    },
    setMaterialValidation: (materialId, status) => {
      if (!session || !hasPermission('validation.manage')) {
        return;
      }

      setState((current) => ({
        ...current,
        learningMaterials: current.learningMaterials.map((material) =>
          material.id !== materialId
            ? material
            : {
                ...material,
                validationStatus: status,
                alignmentStatus: status === 'Valid' ? 'Sesuai' : 'Perlu Cek',
              },
        ),
      }));
    },
    updateOwnPassword: (payload) => {
      if (!session) {
        return {
          success: false,
          message: 'Sesi login tidak ditemukan.',
        };
      }

      const user =
        state.users.find((item) => item.id === session.userId) ??
        state.users.find((item) => item.role === session.role && item.referenceId === session.referenceId);

      if (!user) {
        return {
          success: false,
          message: 'Akun pengguna tidak ditemukan pada data sistem.',
        };
      }

      if (user.password !== payload.currentPassword) {
        return {
          success: false,
          message: 'Password lama tidak sesuai.',
        };
      }

      if (payload.newPassword.trim().length < 6) {
        return {
          success: false,
          message: 'Password baru minimal 6 karakter.',
        };
      }

      setState((current) => ({
        ...current,
        users: current.users.map((item) =>
          item.id === user.id ? { ...item, password: payload.newPassword.trim() } : item,
        ),
      }));

      return {
        success: true,
        message: 'Password berhasil diperbarui. Gunakan password baru saat login berikutnya.',
      };
    },
    updateStudentAccount: (payload) => {
      const accessError = getAccessError('account.view_own', 'Akun aktif tidak memiliki akses mengubah profil siswa.');
      if (accessError) {
        return accessError;
      }

      if (!session || session.role !== 'siswa' || session.referenceId !== payload.studentId) {
        return {
          success: false,
          message: 'Siswa hanya dapat mengubah profil akun miliknya sendiri.',
        };
      }

      const existingStudent = state.students.find((item) => item.id === payload.studentId);
      const name = payload.name.trim();
      const email = payload.email.trim();

      if (!existingStudent || !name || !email) {
        return {
          success: false,
          message: 'Nama dan email siswa wajib diisi.',
        };
      }

      if (!isValidEmail(email)) {
        return {
          success: false,
          message: 'Format email siswa tidak valid.',
        };
      }

      const nextStudent: StudentProfile = {
        ...existingStudent,
        name,
        email,
        avatar: normalizeAvatar(payload.avatar, name),
      };

      setState((current) => {
        const user = findProfileUser(current.users, 'siswa', nextStudent.id, nextStudent.userId);

        return {
          ...current,
          students: current.students.map((item) => (item.id === nextStudent.id ? nextStudent : item)),
          users: user
            ? current.users.map((item) => (item.id === user.id ? { ...item, name } : item))
            : current.users,
        };
      });

      syncActiveSession(nextStudent.id, name);

      return {
        success: true,
        message: 'Profil siswa berhasil diperbarui.',
      };
    },
    updateTeacherProfile: (payload) => {
      const accessError = getAccessError('account.view_own', 'Akun aktif tidak memiliki akses mengubah profil guru.');
      if (accessError) {
        return accessError;
      }

      if (!session || session.role !== 'guru' || session.referenceId !== payload.teacherId) {
        return {
          success: false,
          message: 'Guru hanya dapat mengubah profil akun miliknya sendiri.',
        };
      }

      const existingTeacher = state.teachers.find((item) => item.id === payload.teacherId);
      const name = payload.name.trim();
      const email = payload.email.trim();
      const subjectIds = Array.from(new Set(payload.subjectIds));

      if (!existingTeacher || !name || !email || subjectIds.length === 0) {
        return {
          success: false,
          message: 'Nama, email, dan minimal satu mata pelajaran wajib diisi.',
        };
      }

      if (!isValidEmail(email)) {
        return {
          success: false,
          message: 'Format email guru tidak valid.',
        };
      }

      if (subjectIds.some((subjectId) => !state.subjects.some((subject) => subject.id === subjectId))) {
        return {
          success: false,
          message: 'Terdapat mata pelajaran yang tidak tersedia pada data master.',
        };
      }

      const nextTeacher: TeacherProfile = {
        ...existingTeacher,
        name,
        email,
        subjectIds,
      };

      setState((current) => {
        const user = findProfileUser(current.users, 'guru', nextTeacher.id, nextTeacher.userId);

        return {
          ...current,
          teachers: current.teachers.map((item) => (item.id === nextTeacher.id ? nextTeacher : item)),
          users: user
            ? current.users.map((item) => (item.id === user.id ? { ...item, name } : item))
            : current.users,
        };
      });

      syncActiveSession(nextTeacher.id, name);

      return {
        success: true,
        message: 'Profil guru berhasil diperbarui.',
      };
    },
    saveStudentByAdmin: (payload) => {
      const accessError = getMasterDataAccessError();
      if (accessError) {
        return accessError;
      }

      const existingStudent = payload.id ? state.students.find((item) => item.id === payload.id) : undefined;
      const existingUser = existingStudent
        ? findProfileUser(state.users, 'siswa', existingStudent.id, existingStudent.userId)
        : undefined;
      const name = payload.name.trim();
      const nisn = payload.nisn.trim();
      const email = payload.email.trim();
      const classId = payload.classId.trim();

      if (!name || !nisn || !email || !classId) {
        return {
          success: false,
          message: 'Nama, NISN, kelas, dan email siswa wajib diisi.',
        };
      }

      if (!isValidEmail(email)) {
        return {
          success: false,
          message: 'Format email siswa tidak valid.',
        };
      }

      if (!state.classes.some((item) => item.id === classId)) {
        return {
          success: false,
          message: 'Kelas siswa tidak ditemukan pada data master.',
        };
      }

      if (state.students.some((item) => item.nisn === nisn && item.id !== existingStudent?.id)) {
        return {
          success: false,
          message: 'NISN sudah digunakan oleh siswa lain.',
        };
      }

      if (state.users.some((item) => item.identifier === nisn && item.id !== existingUser?.id)) {
        return {
          success: false,
          message: 'Identifier login tersebut sudah digunakan akun lain.',
        };
      }

      const studentId = existingStudent?.id ?? createId('std');
      const userId = existingUser?.id ?? existingStudent?.userId ?? createId('user-siswa');
      const nextStudent: StudentProfile = {
        id: studentId,
        userId,
        name,
        nisn,
        classId,
        email,
        avatar: normalizeAvatar(payload.avatar, name),
      };
      const nextUser: User = {
        id: userId,
        role: 'siswa',
        identifier: nisn,
        password: existingUser?.password ?? nisn,
        name,
        referenceId: studentId,
      };

      setState((current) => ({
        ...current,
        students: upsertById(current.students, nextStudent),
        users: upsertById(current.users, nextUser),
      }));

      return {
        success: true,
        message: existingStudent
          ? 'Data siswa berhasil diperbarui.'
          : `Data siswa berhasil ditambahkan. Password awal: ${nisn}.`,
      };
    },
    saveTeacherByAdmin: (payload) => {
      const accessError = getMasterDataAccessError();
      if (accessError) {
        return accessError;
      }

      const existingTeacher = payload.id ? state.teachers.find((item) => item.id === payload.id) : undefined;
      const existingUser = existingTeacher
        ? findProfileUser(state.users, 'guru', existingTeacher.id, existingTeacher.userId)
        : undefined;
      const name = payload.name.trim();
      const nip = payload.nip.trim();
      const email = payload.email.trim();
      const subjectIds = Array.from(new Set(payload.subjectIds));

      if (!name || !nip || !email || subjectIds.length === 0) {
        return {
          success: false,
          message: 'Nama, NIP, email, dan minimal satu mapel guru wajib diisi.',
        };
      }

      if (!isValidEmail(email)) {
        return {
          success: false,
          message: 'Format email guru tidak valid.',
        };
      }

      if (subjectIds.some((subjectId) => !state.subjects.some((subject) => subject.id === subjectId))) {
        return {
          success: false,
          message: 'Terdapat mapel guru yang tidak tersedia pada data master.',
        };
      }

      if (state.teachers.some((item) => item.nip === nip && item.id !== existingTeacher?.id)) {
        return {
          success: false,
          message: 'NIP sudah digunakan oleh guru lain.',
        };
      }

      if (state.users.some((item) => item.identifier === nip && item.id !== existingUser?.id)) {
        return {
          success: false,
          message: 'Identifier login tersebut sudah digunakan akun lain.',
        };
      }

      const teacherId = existingTeacher?.id ?? createId('t');
      const userId = existingUser?.id ?? existingTeacher?.userId ?? createId('user-guru');
      const nextTeacher: TeacherProfile = {
        id: teacherId,
        userId,
        name,
        nip,
        email,
        subjectIds,
      };
      const nextUser: User = {
        id: userId,
        role: 'guru',
        identifier: nip,
        password: existingUser?.password ?? nip,
        name,
        referenceId: teacherId,
      };

      setState((current) => ({
        ...current,
        teachers: upsertById(current.teachers, nextTeacher),
        users: upsertById(current.users, nextUser),
      }));

      return {
        success: true,
        message: existingTeacher
          ? 'Data guru berhasil diperbarui.'
          : `Data guru berhasil ditambahkan. Password awal: ${nip}.`,
      };
    },
    saveClassByAdmin: (payload) => {
      const accessError = getMasterDataAccessError();
      if (accessError) {
        return accessError;
      }

      const existingClass = payload.id ? state.classes.find((item) => item.id === payload.id) : undefined;
      const name = payload.name.trim();
      const major = payload.major.trim();
      const homeroomTeacherId = payload.homeroomTeacherId.trim();

      if (!name || !major || !homeroomTeacherId) {
        return {
          success: false,
          message: 'Nama kelas, jurusan, dan wali kelas wajib diisi.',
        };
      }

      if (!state.teachers.some((item) => item.id === homeroomTeacherId)) {
        return {
          success: false,
          message: 'Wali kelas tidak ditemukan pada data guru.',
        };
      }

      if (state.classes.some((item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== existingClass?.id)) {
        return {
          success: false,
          message: 'Nama kelas sudah digunakan.',
        };
      }

      const nextClass: ClassRoom = {
        id: existingClass?.id ?? createId('cls'),
        name,
        major,
        homeroomTeacherId,
      };

      setState((current) => ({
        ...current,
        classes: upsertById(current.classes, nextClass),
      }));

      return {
        success: true,
        message: existingClass ? 'Data kelas berhasil diperbarui.' : 'Data kelas berhasil ditambahkan.',
      };
    },
    saveSubjectByAdmin: (payload) => {
      const accessError = getMasterDataAccessError();
      if (accessError) {
        return accessError;
      }

      const existingSubject = payload.id ? state.subjects.find((item) => item.id === payload.id) : undefined;
      const name = payload.name.trim();
      const shortName = payload.shortName.trim();

      if (!name || !shortName) {
        return {
          success: false,
          message: 'Nama dan singkatan mata pelajaran wajib diisi.',
        };
      }

      if (
        state.subjects.some((item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== existingSubject?.id)
      ) {
        return {
          success: false,
          message: 'Nama mata pelajaran sudah digunakan.',
        };
      }

      const nextSubject: Subject = {
        id: existingSubject?.id ?? createId('sub'),
        name,
        shortName,
      };

      setState((current) => ({
        ...current,
        subjects: upsertById(current.subjects, nextSubject),
      }));

      return {
        success: true,
        message: existingSubject ? 'Data mapel berhasil diperbarui.' : 'Data mapel berhasil ditambahkan.',
      };
    },
    saveScheduleByAdmin: (payload) => {
      const accessError = getMasterDataAccessError();
      if (accessError) {
        return accessError;
      }

      const existingSchedule = payload.id ? state.schedules.find((item) => item.id === payload.id) : undefined;
      const day = Number(payload.day);
      const classId = payload.classId.trim();
      const subjectId = payload.subjectId.trim();
      const teacherId = payload.teacherId.trim();
      const startTime = payload.startTime.trim();
      const endTime = payload.endTime.trim();
      const room = payload.room.trim();

      if (!classId || !subjectId || !teacherId || !startTime || !endTime || !room) {
        return {
          success: false,
          message: 'Kelas, mapel, guru, jam, dan ruang jadwal wajib diisi.',
        };
      }

      if (day < 1 || day > 5) {
        return {
          success: false,
          message: 'Jadwal sekolah hanya dapat dibuat untuk Senin sampai Jumat.',
        };
      }

      if (startTime >= endTime) {
        return {
          success: false,
          message: 'Jam mulai harus lebih awal dari jam selesai.',
        };
      }

      if (!state.classes.some((item) => item.id === classId)) {
        return {
          success: false,
          message: 'Kelas pada jadwal tidak ditemukan.',
        };
      }

      if (!state.subjects.some((item) => item.id === subjectId)) {
        return {
          success: false,
          message: 'Mata pelajaran pada jadwal tidak ditemukan.',
        };
      }

      const teacher = state.teachers.find((item) => item.id === teacherId);
      if (!teacher) {
        return {
          success: false,
          message: 'Guru pada jadwal tidak ditemukan.',
        };
      }

      if (!teacher.subjectIds.includes(subjectId)) {
        return {
          success: false,
          message: 'Guru terpilih belum mengampu mata pelajaran tersebut.',
        };
      }

      const hasClassConflict = state.schedules.some(
        (item) =>
          item.id !== existingSchedule?.id &&
          item.classId === classId &&
          item.day === day &&
          item.startTime === startTime,
      );
      const hasTeacherConflict = state.schedules.some(
        (item) =>
          item.id !== existingSchedule?.id &&
          item.teacherId === teacherId &&
          item.day === day &&
          item.startTime === startTime,
      );

      if (hasClassConflict || hasTeacherConflict) {
        return {
          success: false,
          message: 'Terdapat bentrok kelas atau guru pada hari dan jam mulai yang sama.',
        };
      }

      const nextSchedule: Schedule = {
        id: existingSchedule?.id ?? createId('sch'),
        classId,
        subjectId,
        teacherId,
        day,
        startTime,
        endTime,
        room,
      };

      setState((current) => ({
        ...current,
        schedules: upsertById(current.schedules, nextSchedule),
      }));

      return {
        success: true,
        message: existingSchedule ? 'Data jadwal berhasil diperbarui.' : 'Data jadwal berhasil ditambahkan.',
      };
    },
    deleteMasterData: (kind, id) => {
      const accessError = getMasterDataAccessError();
      if (accessError) {
        return accessError;
      }

      if (kind === 'student') {
        const hasReferences =
          state.studentAttendances.some((item) => item.studentId === id) ||
          state.studentJournals.some((item) => item.studentId === id) ||
          state.questionnaires.some((item) => item.studentId === id) ||
          state.assessments.some((item) => item.studentStatuses.some((status) => status.studentId === id));

        if (hasReferences) {
          return {
            success: false,
            message: 'Siswa tidak dapat dihapus karena sudah memiliki data pembelajaran.',
          };
        }

        setState((current) => ({
          ...current,
          students: current.students.filter((item) => item.id !== id),
          users: current.users.filter((item) => !(item.role === 'siswa' && item.referenceId === id)),
        }));

        return { success: true, message: 'Data siswa berhasil dihapus.' };
      }

      if (kind === 'teacher') {
        const hasReferences =
          state.schedules.some((item) => item.teacherId === id) ||
          state.classes.some((item) => item.homeroomTeacherId === id) ||
          state.teacherAttendances.some((item) => item.teacherId === id) ||
          state.learningMaterials.some((item) => item.teacherId === id) ||
          state.assessments.some((item) => item.teacherId === id) ||
          state.questionnaires.some((item) => item.teacherId === id);

        if (hasReferences) {
          return {
            success: false,
            message: 'Guru tidak dapat dihapus karena masih terhubung dengan jadwal atau data pembelajaran.',
          };
        }

        setState((current) => ({
          ...current,
          teachers: current.teachers.filter((item) => item.id !== id),
          users: current.users.filter((item) => !(item.role === 'guru' && item.referenceId === id)),
        }));

        return { success: true, message: 'Data guru berhasil dihapus.' };
      }

      if (kind === 'class') {
        const hasReferences =
          state.students.some((item) => item.classId === id) || state.schedules.some((item) => item.classId === id);

        if (hasReferences) {
          return {
            success: false,
            message: 'Kelas tidak dapat dihapus karena masih memiliki siswa atau jadwal.',
          };
        }

        setState((current) => ({
          ...current,
          classes: current.classes.filter((item) => item.id !== id),
        }));

        return { success: true, message: 'Data kelas berhasil dihapus.' };
      }

      if (kind === 'subject') {
        const hasReferences =
          state.schedules.some((item) => item.subjectId === id) ||
          state.teachers.some((item) => item.subjectIds.includes(id)) ||
          state.assessments.some((item) => item.subjectId === id);

        if (hasReferences) {
          return {
            success: false,
            message: 'Mapel tidak dapat dihapus karena masih dipakai guru, jadwal, atau assessment.',
          };
        }

        setState((current) => ({
          ...current,
          subjects: current.subjects.filter((item) => item.id !== id),
        }));

        return { success: true, message: 'Data mapel berhasil dihapus.' };
      }

      const hasReferences =
        state.teacherAttendances.some((item) => item.scheduleId === id) ||
        state.studentAttendances.some((item) => item.scheduleId === id) ||
        state.learningMaterials.some((item) => item.scheduleId === id) ||
        state.assessments.some((item) => item.scheduleId === id) ||
        state.questionnaires.some((item) => item.scheduleId === id) ||
        state.studentJournals.some((item) => item.scheduleId === id);

      if (hasReferences) {
        return {
          success: false,
          message: 'Jadwal tidak dapat dihapus karena sudah memiliki data pembelajaran.',
        };
      }

      setState((current) => ({
        ...current,
        schedules: current.schedules.filter((item) => item.id !== id),
      }));

      return { success: true, message: 'Data jadwal berhasil dihapus.' };
    },
    resetData: () => {
      if (!session || !hasPermission('master.data.manage')) {
        return;
      }

      setState(initialAppDataState);
    },
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppDataContext() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppDataContext harus digunakan di dalam AppDataProvider');
  }
  return context;
}
