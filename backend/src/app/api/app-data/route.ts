import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  listClasses,
  listLearningMaterials,
  listSchedules,
  listStudentAttendances,
  listStudents,
  listSubjects,
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
  ] = await Promise.all([
    listStudents(),
    listTeachers(),
    listClasses(),
    listSubjects(),
    listSchedules(),
    listStudentAttendances(),
    listTeacherAttendances(),
    listLearningMaterials(),
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
    assessments: [],
    questionnaires: [],
    studentJournals: [],
  });
}
