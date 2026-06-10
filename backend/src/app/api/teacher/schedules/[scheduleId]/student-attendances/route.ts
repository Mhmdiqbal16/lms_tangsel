import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import {
  getRepositoryDateOrAcademicToday,
  getScheduleById,
  getScheduleView,
  getStudentAttendance,
  getStudentsForClass,
  getTeacherAttendance,
} from '@/lib/repository';
import { fail, ok } from '@/lib/responses';

type RouteContext = {
  params: Promise<{
    scheduleId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { user, response } = await requireRole(request, ['guru']);

  if (response) {
    return response;
  }

  const { scheduleId } = await context.params;
  const schedule = await getScheduleById(scheduleId);
  const teacherId = user.referenceId;

  if (!schedule || schedule.teacherId !== teacherId) {
    return fail('Jadwal tidak ditemukan untuk guru ini.', 403);
  }

  const date = getRepositoryDateOrAcademicToday(request.nextUrl.searchParams.get('date'));
  const teacherAttendance = await getTeacherAttendance({
    teacherId,
    scheduleId: schedule.id,
    date,
  });

  const classroomStudents = await getStudentsForClass(schedule.classId);

  return ok({
    date,
    schedule: await getScheduleView(schedule),
    teacherAttendance,
    students: await Promise.all(
      classroomStudents.map(async (student) => ({
        student,
        attendance: await getStudentAttendance({
          studentId: student.id,
          scheduleId: schedule.id,
          date,
        }),
      })),
    ),
  });
}
