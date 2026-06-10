import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import {
  getRepositoryTodayDate,
  getScheduleView,
  getTeacherAttendance,
  getTeacherSchedulesForDay,
  parseRepositoryISODate,
} from '@/lib/repository';
import { ok } from '@/lib/responses';

export async function GET(request: NextRequest) {
  const { user, response } = await requireRole(request, ['guru']);

  if (response) {
    return response;
  }

  const date = getRepositoryTodayDate();
  const day = parseRepositoryISODate(date).getDay();
  const teacherId = user.referenceId;
  const todaySchedules = await getTeacherSchedulesForDay(teacherId, day);

  return ok(
    await Promise.all(
      todaySchedules.map(async (schedule) => ({
        date,
        schedule: await getScheduleView(schedule),
        attendance: await getTeacherAttendance({
          teacherId,
          scheduleId: schedule.id,
          date,
        }),
      })),
    ),
  );
}
