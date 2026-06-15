import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import {
  createLearningMaterial,
  getLearningMaterial,
  getRepositoryDateOrAcademicToday,
  getScheduleById,
  parseRepositoryISODate,
  RepositoryError,
} from '@/lib/repository';
import { created, fail } from '@/lib/responses';
import type { LearningMaterial } from '@/types/domain';

const learningMaterialSchema = z.object({
  teacherId: z.string().min(1).optional(),
  scheduleId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  meeting: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const { user, response } = await requireRole(request, ['guru']);

  if (response) {
    return response;
  }

  const parsed = learningMaterialSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data materi pembelajaran tidak valid.', 422);
  }

  const teacherId = user.referenceId;
  if (parsed.data.teacherId && parsed.data.teacherId !== teacherId) {
    return fail('Guru hanya dapat menginput materi untuk akun yang sedang login.', 403);
  }

  const schedule = await getScheduleById(parsed.data.scheduleId);

  if (!schedule || schedule.teacherId !== teacherId) {
    return fail('Jadwal tidak ditemukan untuk guru ini.', 403);
  }

  const date = getRepositoryDateOrAcademicToday(parsed.data.date);
  if (schedule.day !== parseRepositoryISODate(date).getDay()) {
    return fail('Materi hanya dapat diinput sesuai hari pada jadwal mengajar.', 403);
  }

  const duplicate = await getLearningMaterial({ scheduleId: schedule.id, date });
  if (duplicate) {
    return fail('Materi untuk jadwal dan tanggal tersebut sudah tersedia.', 409);
  }

  const material: LearningMaterial = {
    id: `mat-${teacherId}-${Date.now()}`,
    teacherId,
    scheduleId: schedule.id,
    date,
    meeting: parsed.data.meeting,
    title: parsed.data.title.trim(),
    description: parsed.data.description.trim(),
    validationStatus: 'Menunggu',
    alignmentStatus: 'Sesuai',
  };

  try {
    return created(await createLearningMaterial(material));
  } catch (error) {
    if (error instanceof RepositoryError) {
      return fail(error.message, error.status);
    }

    return fail(error instanceof Error ? error.message : 'Materi pembelajaran gagal disimpan.', 500);
  }
}
