import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import {
  createStudentJournal,
  getRepositoryDateOrAcademicToday,
  getScheduleById,
  getStudentById,
  getStudentJournal,
  listAssessments,
  parseRepositoryISODate,
  RepositoryError,
} from '@/lib/repository';
import { created, fail } from '@/lib/responses';
import type { AssessmentRecord, StudentJournal } from '@/types/domain';

const journalSchema = z.object({
  studentId: z.string().min(1).optional(),
  scheduleId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  materialStudied: z.string().min(1),
  summary: z.string().min(1),
  tasks: z.string().min(1),
  learningObstacles: z.string().min(1),
  attachmentName: z.string().optional(),
});

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function differenceInCalendarDays(laterDate: string, earlierDate: string) {
  const later = startOfDay(parseRepositoryISODate(laterDate));
  const earlier = startOfDay(parseRepositoryISODate(earlierDate));
  return Math.round((later.getTime() - earlier.getTime()) / 86_400_000);
}

function isAssessmentDone(
  assessments: AssessmentRecord[],
  type: AssessmentRecord['type'],
  scheduleId: string,
  date: string,
  studentId: string,
) {
  return assessments
    .filter((assessment) => assessment.type === type && assessment.scheduleId === scheduleId && assessment.date === date)
    .some((assessment) =>
      assessment.studentStatuses.some((status) => status.studentId === studentId && status.completed),
    );
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireRole(request, ['siswa']);

  if (response) {
    return response;
  }

  const parsed = journalSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data jurnal siswa tidak valid.', 422);
  }

  const studentId = user.referenceId;
  if (parsed.data.studentId && parsed.data.studentId !== studentId) {
    return fail('Siswa hanya dapat mengisi jurnal untuk akun sendiri.', 403);
  }

  const [student, schedule] = await Promise.all([
    getStudentById(studentId),
    getScheduleById(parsed.data.scheduleId),
  ]);

  if (!student) {
    return fail('Profil siswa tidak ditemukan.', 404);
  }

  if (!schedule || schedule.classId !== student.classId) {
    return fail('Jadwal tidak tersedia untuk siswa ini.', 403);
  }

  const date = getRepositoryDateOrAcademicToday(parsed.data.date);
  if (schedule.day !== parseRepositoryISODate(date).getDay()) {
    return fail('Jurnal hanya dapat diisi sesuai hari pada jadwal pelajaran.', 403);
  }

  const daysDifference = differenceInCalendarDays(getRepositoryDateOrAcademicToday(), date);
  if (daysDifference < 0 || daysDifference > 1) {
    return fail('Batas pengisian jurnal sudah melewati H+1 dari jadwal pembelajaran.', 403);
  }

  const duplicate = await getStudentJournal({ studentId, scheduleId: schedule.id, date });
  if (duplicate) {
    return fail('Jurnal sudah pernah diisi untuk tanggal dan mata pelajaran yang sama.', 409);
  }

  const assessments = await listAssessments();
  const pretestDone = isAssessmentDone(assessments, 'pretest', schedule.id, date, studentId);

  if (!pretestDone) {
    return fail('Selesaikan pretest sebelum mengisi jurnal.', 403);
  }

  const journal: StudentJournal = {
    id: `jur-${studentId}-${Date.now()}`,
    studentId,
    scheduleId: schedule.id,
    date,
    materialStudied: parsed.data.materialStudied.trim(),
    summary: parsed.data.summary.trim(),
    tasks: parsed.data.tasks.trim(),
    learningObstacles: parsed.data.learningObstacles.trim(),
    attachmentName: parsed.data.attachmentName?.trim() || 'lampiran-dummy.pdf',
    entryStatus: 'Selesai',
    reviewStatus: 'Menunggu Review',
    notes: 'Menunggu review guru.',
    validationStatus: 'Menunggu',
  };

  try {
    return created(await createStudentJournal(journal));
  } catch (error) {
    if (error instanceof RepositoryError) {
      return fail(error.message, error.status);
    }

    return fail(error instanceof Error ? error.message : 'Jurnal siswa gagal disimpan.', 500);
  }
}
