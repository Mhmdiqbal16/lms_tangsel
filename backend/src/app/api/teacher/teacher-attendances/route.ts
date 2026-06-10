import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import {
  createTeacherAttendance,
  getRepositoryDateOrAcademicToday,
  getScheduleById,
  getTeacherAttendance,
  parseRepositoryISODate,
} from '@/lib/repository';
import { created, fail } from '@/lib/responses';
import type { TeacherAttendance } from '@/types/domain';

const attendanceSchema = z.object({
  teacherId: z.string().min(1).optional(),
  scheduleId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['Hadir', 'Izin']),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { user, response } = await requireRole(request, ['guru']);

  if (response) {
    return response;
  }

  const parsed = attendanceSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data presensi guru tidak valid.', 422);
  }

  const teacherId = user.referenceId;
  if (parsed.data.teacherId && parsed.data.teacherId !== teacherId) {
    return fail('Guru hanya dapat mengisi presensi untuk akun yang sedang login.', 403);
  }

  const schedule = await getScheduleById(parsed.data.scheduleId);

  if (!schedule || schedule.teacherId !== teacherId) {
    return fail('Jadwal tidak ditemukan untuk guru ini.', 403);
  }

  const date = getRepositoryDateOrAcademicToday(parsed.data.date);
  if (schedule.day !== parseRepositoryISODate(date).getDay()) {
    return fail('Presensi hanya dapat dibuat sesuai hari pada jadwal mengajar.', 403);
  }

  const duplicate = await getTeacherAttendance({
    teacherId,
    scheduleId: schedule.id,
    date,
  });

  if (duplicate) {
    return fail('Presensi untuk jadwal dan tanggal ini sudah pernah diinput.', 409);
  }

  const attendance: TeacherAttendance = {
    id: `pres-${teacherId}-${Date.now()}`,
    teacherId,
    scheduleId: schedule.id,
    date,
    status: parsed.data.status,
    notes: parsed.data.notes?.trim() ?? '',
  };

  return created(await createTeacherAttendance(attendance));
}
