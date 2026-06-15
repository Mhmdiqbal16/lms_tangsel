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

  const sessions: StudentLearningSession[] =
    recentDates.flatMap((date) =>
      appData.schedules
        .filter((item) => item.classId === student?.classId && item.day === date.getDay())
        .sort((first, second) => first.startTime.localeCompare(second.startTime))
        .map((schedule) => {
          const sessionDate = toISODate(date);
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
        }),
    ) ?? [];

  return {
    ...appData,
    student,
    sessions,
  };
}
