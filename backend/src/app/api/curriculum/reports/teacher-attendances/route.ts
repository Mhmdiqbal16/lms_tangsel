import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getScheduleById, getScheduleView, listTeacherAttendances } from '@/lib/repository';
import { ok } from '@/lib/responses';

export async function GET(request: NextRequest) {
  const { response } = await requireRole(request, ['kurikulum', 'admin']);

  if (response) {
    return response;
  }

  const teacherAttendances = await listTeacherAttendances();

  return ok(
    await Promise.all(
      teacherAttendances.map(async (attendance) => {
        const schedule = await getScheduleById(attendance.scheduleId);

        return {
          ...attendance,
          schedule: schedule ? await getScheduleView(schedule) : null,
        };
      }),
    ),
  );
}
