import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getScheduleView, getSchedulesForClass, getStudentById } from '@/lib/repository';
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

  const schedules = await getSchedulesForClass(student.classId);
  return ok(await Promise.all(schedules.map(getScheduleView)));
}
