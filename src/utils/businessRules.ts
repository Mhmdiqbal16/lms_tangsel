import {
  AssessmentRecord,
  Role,
  Schedule,
  StudentJournal,
  TeacherQuestionnaire,
  TeacherAttendance,
} from '@/types';
import { differenceInCalendarDays, parseISODate } from '@/utils/date';

export interface JournalEligibilityResult {
  hasSchedule: boolean;
  withinWindow: boolean;
  pretestDone: boolean;
  posttestDone: boolean;
  questionnaireDone: boolean;
  duplicate: boolean;
  locked: boolean;
  canSubmit: boolean;
  status: 'Selesai' | 'Belum' | 'Terkunci';
  message: string;
  pretestAssessmentId?: string;
  posttestAssessmentId?: string;
  questionnaireId?: string;
}

function getAssessmentState(
  assessments: AssessmentRecord[],
  type: 'pretest' | 'posttest',
  scheduleId: string,
  date: string,
  studentId: string,
) {
  const assessment = assessments.find(
    (item) => item.type === type && item.scheduleId === scheduleId && item.date === date,
  );
  const studentStatus = assessment?.studentStatuses.find((item) => item.studentId === studentId);

  return {
    assessment,
    completed: studentStatus?.completed ?? false,
  };
}

export function getJournalEligibility(params: {
  studentId: string;
  scheduleId: string;
  sessionDate: string;
  journals: StudentJournal[];
  assessments: AssessmentRecord[];
  questionnaires: TeacherQuestionnaire[];
  currentDate: string;
}) {
  const { studentId, scheduleId, sessionDate, journals, assessments, questionnaires, currentDate } = params;

  const duplicate = journals.some(
    (item) => item.studentId === studentId && item.scheduleId === scheduleId && item.date === sessionDate,
  );
  const daysDifference = differenceInCalendarDays(currentDate, sessionDate);
  const withinWindow = daysDifference >= 0 && daysDifference <= 1;
  const locked = !withinWindow;
  const pretestState = getAssessmentState(assessments, 'pretest', scheduleId, sessionDate, studentId);
  const posttestState = getAssessmentState(assessments, 'posttest', scheduleId, sessionDate, studentId);
  const questionnaire = questionnaires.find(
    (item) => item.studentId === studentId && item.scheduleId === scheduleId && item.date === sessionDate,
  );
  const questionnaireDone = questionnaire?.completed ?? false;
  const canSubmit = withinWindow && pretestState.completed && !duplicate;

  let status: JournalEligibilityResult['status'] = 'Belum';
  let message = 'Selesaikan pretest terlebih dahulu untuk membuka form jurnal.';

  if (duplicate) {
    status = 'Selesai';
    message = 'Jurnal sudah dikirim. Posttest dan kuisioner dapat dikerjakan.';
  } else if (locked) {
    status = 'Terkunci';
    message = 'Batas pengisian jurnal sudah melewati H+1 dari jadwal pembelajaran.';
  } else if (canSubmit) {
    message = 'Pretest selesai. Form jurnal siap diisi.';
  }

  return {
    hasSchedule: true,
    withinWindow,
    pretestDone: pretestState.completed,
    posttestDone: posttestState.completed,
    questionnaireDone,
    duplicate,
    locked,
    canSubmit,
    status,
    message,
    pretestAssessmentId: pretestState.assessment?.id,
    posttestAssessmentId: posttestState.assessment?.id,
    questionnaireId: questionnaire?.id,
  } satisfies JournalEligibilityResult;
}

export function isTeacherScheduleAllowed(schedules: Schedule[], teacherId: string, scheduleId: string, date: string) {
  const schedule = schedules.find((item) => item.id === scheduleId && item.teacherId === teacherId);
  if (!schedule) {
    return false;
  }
  const sessionDay = parseISODate(date).getDay();
  return schedule.day === sessionDay;
}

export function isTeacherAttendanceDuplicate(
  teacherAttendances: TeacherAttendance[],
  teacherId: string,
  scheduleId: string,
  date: string,
) {
  return teacherAttendances.some(
    (item) => item.teacherId === teacherId && item.scheduleId === scheduleId && item.date === date,
  );
}

export function getHomeRoute(role: Role) {
  return {
    siswa: '/siswa/dashboard',
    guru: '/guru/dashboard',
    kurikulum: '/kurikulum/dashboard',
    admin: '/admin/dashboard',
  }[role];
}
