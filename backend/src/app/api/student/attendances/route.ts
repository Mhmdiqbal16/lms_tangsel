import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getScheduleById, getScheduleView, getStudentAttendancesForStudent, getStudentById } from '@/lib/repository';
import { fail, ok } from '@/lib/responses';

export async function GET(request: NextRequest) {
  const { user, response } = await requireRole(request, ['siswa']);

  if (response) {
    return response;
  }

  const student = await getStudentById(user.referenceId);

  if (!student) {
    return fail('Profil siswa tidak ditemukan.', 404);
  }

  const attendances = await getStudentAttendancesForStudent(student.id);
  return ok(
    await Promise.all(
      attendances.map(async (attendance) => {
        const schedule = await getScheduleById(attendance.scheduleId);
        return {
          ...attendance,
          schedule: schedule ? await getScheduleView(schedule) : null,
        };
      }),
    ),
  );
}
