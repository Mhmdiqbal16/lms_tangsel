import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import {
  completeTeacherQuestionnaire,
  getRepositoryDateOrAcademicToday,
  getScheduleById,
  getStudentById,
  getStudentJournal,
  parseRepositoryISODate,
} from '@/lib/repository';
import { created, fail } from '@/lib/responses';
import type { TeacherQuestionnaire } from '@/types/domain';

const ratingSchema = z.object({
  clarity: z.number().int().min(1).max(5),
  interaction: z.number().int().min(1).max(5),
  discipline: z.number().int().min(1).max(5),
  support: z.number().int().min(1).max(5),
});

const questionnaireSchema = z.object({
  studentId: z.string().min(1).optional(),
  teacherId: z.string().min(1),
  scheduleId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ratings: ratingSchema,
  note: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const { user, response } = await requireRole(request, ['siswa']);

  if (response) {
    return response;
  }

  const parsed = questionnaireSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data kuisioner guru tidak valid.', 422);
  }

  const studentId = user.referenceId;
  if (parsed.data.studentId && parsed.data.studentId !== studentId) {
    return fail('Siswa hanya dapat mengisi kuisioner untuk akun sendiri.', 403);
  }

  const [student, schedule] = await Promise.all([
    getStudentById(studentId),
    getScheduleById(parsed.data.scheduleId),
  ]);

  if (!student) {
    return fail('Profil siswa tidak ditemukan.', 404);
  }

  if (!schedule || schedule.classId !== student.classId || schedule.teacherId !== parsed.data.teacherId) {
    return fail('Jadwal tidak tersedia untuk siswa ini.', 403);
  }

  const date = getRepositoryDateOrAcademicToday(parsed.data.date);
  if (schedule.day !== parseRepositoryISODate(date).getDay()) {
    return fail('Kuisioner hanya dapat diisi sesuai hari pada jadwal pelajaran.', 403);
  }

  const journal = await getStudentJournal({ studentId, scheduleId: schedule.id, date });
  if (!journal) {
    return fail('Kirim jurnal terlebih dahulu sebelum mengisi kuisioner guru.', 403);
  }

  const questionnaire: TeacherQuestionnaire = {
    id: `kui-${studentId}-${Date.now()}`,
    studentId,
    teacherId: schedule.teacherId,
    scheduleId: schedule.id,
    date,
    completed: true,
    ratings: parsed.data.ratings,
    note: parsed.data.note?.trim() ?? '',
  };

  return created(await completeTeacherQuestionnaire(questionnaire));
}
