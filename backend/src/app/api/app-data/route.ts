import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  listAssessments,
  listClasses,
  listLearningMaterials,
  listSchedules,
  listStudentAttendances,
  listStudentJournals,
  listStudents,
  listSubjects,
  listTeacherQuestionnaires,
  listTeacherAttendances,
  listTeachers,
} from '@/lib/repository';
import { ok } from '@/lib/responses';

export async function GET(request: NextRequest) {
  const { response } = await requireUser(request);

  if (response) {
    return response;
  }

  const [
    students,
    teachers,
    classes,
    subjects,
    schedules,
    studentAttendances,
    teacherAttendances,
    learningMaterials,
    assessments,
    questionnaires,
    studentJournals,
  ] = await Promise.all([
    listStudents(),
    listTeachers(),
    listClasses(),
    listSubjects(),
    listSchedules(),
    listStudentAttendances(),
    listTeacherAttendances(),
    listLearningMaterials(),
    listAssessments(),
    listTeacherQuestionnaires(),
    listStudentJournals(),
  ]);

  return ok({
    users: [],
    students,
    teachers,
    curricula: [],
    admins: [],
    classes,
    subjects,
    schedules,
    studentAttendances,
    teacherAttendances,
    learningMaterials,
    assessments,
    questionnaires,
    studentJournals,
  });
}
