import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getScheduleById, getScheduleView, getStudentById, listStudentAttendances } from '@/lib/repository';
import { ok } from '@/lib/responses';

export async function GET(request: NextRequest) {
  const { response } = await requireRole(request, ['kurikulum', 'admin']);

  if (response) {
    return response;
  }

  const studentAttendances = await listStudentAttendances();

  return ok(
    await Promise.all(
      studentAttendances.map(async (attendance) => {
        const schedule = await getScheduleById(attendance.scheduleId);

        return {
          ...attendance,
          student: await getStudentById(attendance.studentId),
          schedule: schedule ? await getScheduleView(schedule) : null,
        };
      }),
    ),
  );
}
