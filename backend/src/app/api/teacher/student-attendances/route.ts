import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import {
  getRepositoryDateOrAcademicToday,
  getScheduleById,
  getStudentAttendance,
  getStudentsForClass,
  getTeacherAttendance,
  parseRepositoryISODate,
  saveStudentAttendances,
} from '@/lib/repository';
import { created, fail } from '@/lib/responses';
import type { StudentAttendance } from '@/types/domain';

const attendanceItemSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(['Hadir', 'Izin', 'Alfa']),
});

const saveStudentAttendancesSchema = z.object({
  teacherId: z.string().min(1).optional(),
  scheduleId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  attendances: z.array(attendanceItemSchema).min(1),
});

export async function POST(request: NextRequest) {
  const { user, response } = await requireRole(request, ['guru']);

  if (response) {
    return response;
  }

  const parsed = saveStudentAttendancesSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data absensi siswa tidak valid.', 422);
  }

  const teacherId = user.referenceId;
  if (parsed.data.teacherId && parsed.data.teacherId !== teacherId) {
    return fail('Guru hanya dapat mengelola absensi siswa untuk akun yang sedang login.', 403);
  }

  const schedule = await getScheduleById(parsed.data.scheduleId);

  if (!schedule || schedule.teacherId !== teacherId) {
    return fail('Jadwal tidak ditemukan untuk guru ini.', 403);
  }

  const date = getRepositoryDateOrAcademicToday(parsed.data.date);
  if (schedule.day !== parseRepositoryISODate(date).getDay()) {
    return fail('Absensi siswa hanya dapat diisi sesuai hari pada jadwal mengajar.', 403);
  }

  const teacherAttendance = await getTeacherAttendance({
    teacherId,
    scheduleId: schedule.id,
    date,
  });

  if (!teacherAttendance || teacherAttendance.status !== 'Hadir') {
    return fail('Guru harus presensi Hadir sebelum mengisi absensi siswa.', 403);
  }

  const classroomStudents = await getStudentsForClass(schedule.classId);
  const classroomStudentIds = new Set(classroomStudents.map((student) => student.id));

  const invalidStudent = parsed.data.attendances.find(
    (attendance) => !classroomStudentIds.has(attendance.studentId),
  );

  if (invalidStudent) {
    return fail('Ada siswa yang tidak termasuk kelas pada jadwal ini.', 422);
  }

  const savedDrafts = await Promise.all(
    parsed.data.attendances.map(async (item) => {
      const existing = await getStudentAttendance({
        studentId: item.studentId,
        scheduleId: schedule.id,
        date,
      });

      return {
        id: existing?.id ?? `student-attendance-${item.studentId}-${Date.now()}`,
        studentId: item.studentId,
        scheduleId: schedule.id,
        date,
        status: item.status,
      } satisfies StudentAttendance;
    }),
  );

  return created(await saveStudentAttendances(savedDrafts));
}
