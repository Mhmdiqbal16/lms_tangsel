import { academicDateReference } from '@/data/mockData';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { getJournalEligibility, JournalEligibilityResult } from '@/utils/businessRules';
import { getRecentSchoolDates, parseISODate, toISODate } from '@/utils/date';
import type {
  LearningMaterial,
  Schedule,
  StudentJournal,
  Subject,
  TeacherProfile,
} from '@/types';

export interface StudentLearningSession {
  key: string;
  schedule: Schedule;
  sessionDate: string;
  subject?: Subject;
  teacher?: TeacherProfile;
  material?: LearningMaterial;
  journal?: StudentJournal;
  eligibility: JournalEligibilityResult;
}

export function useStudentLearningSessions() {
  const { session } = useAuth();
  const appData = useAppData();
  const student = appData.students.find((item) => item.id === session?.referenceId);
  const recentDates = getRecentSchoolDates(3, parseISODate(academicDateReference));

  const buildSession = (schedule: Schedule, sessionDate: string): StudentLearningSession => {
    const material = appData.learningMaterials.find(
      (item) => item.scheduleId === schedule.id && item.date === sessionDate,
    );
    const journal = appData.studentJournals.find(
      (item) => item.studentId === student?.id && item.scheduleId === schedule.id && item.date === sessionDate,
    );

    return {
      key: `${schedule.id}-${sessionDate}`,
      schedule,
      sessionDate,
      subject: appData.subjects.find((item) => item.id === schedule.subjectId),
      teacher: appData.teachers.find((item) => item.id === schedule.teacherId),
      material,
      journal,
      eligibility: getJournalEligibility({
        studentId: student?.id ?? '',
        scheduleId: schedule.id,
        sessionDate,
        journals: appData.studentJournals,
        assessments: appData.assessments,
        questionnaires: appData.questionnaires,
        currentDate: academicDateReference,
      }),
    };
  };

  const sessions: StudentLearningSession[] =
    recentDates.flatMap((date) =>
      appData.schedules
        .filter((item) => item.classId === student?.classId && item.day === date.getDay())
        .sort((first, second) => first.startTime.localeCompare(second.startTime))
        .map((schedule) => {
          const sessionDate = toISODate(date);
          return buildSession(schedule, sessionDate);
        }),
    ) ?? [];

  const historySessionKeys = new Map<string, { scheduleId: string; date: string }>();

  sessions.forEach((learningSession) => {
    historySessionKeys.set(learningSession.key, {
      scheduleId: learningSession.schedule.id,
      date: learningSession.sessionDate,
    });
  });

  appData.studentAttendances
    .filter((attendance) => attendance.studentId === student?.id)
    .forEach((attendance) => {
      historySessionKeys.set(`${attendance.scheduleId}-${attendance.date}`, {
        scheduleId: attendance.scheduleId,
        date: attendance.date,
      });
    });

  appData.studentJournals
    .filter((journal) => journal.studentId === student?.id)
    .forEach((journal) => {
      historySessionKeys.set(`${journal.scheduleId}-${journal.date}`, {
        scheduleId: journal.scheduleId,
        date: journal.date,
      });
    });

  const historySessions = Array.from(historySessionKeys.values())
    .flatMap((historySession) => {
      const schedule = appData.schedules.find((item) => item.id === historySession.scheduleId);
      return schedule ? [buildSession(schedule, historySession.date)] : [];
    })
    .sort(
      (first, second) =>
        second.sessionDate.localeCompare(first.sessionDate) ||
        first.schedule.startTime.localeCompare(second.schedule.startTime),
    );

  return {
    ...appData,
    student,
    sessions,
    historySessions,
  };
}
