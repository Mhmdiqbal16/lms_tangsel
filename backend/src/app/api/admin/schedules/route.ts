import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { listSchedules, RepositoryError, saveSchedule } from '@/lib/repository';
import { created, fail, ok } from '@/lib/responses';

const scheduleSchema = z.object({
  id: z.string().optional(),
  classId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  day: z.number().int().min(1).max(5),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const { response } = await requireRole(request, ['admin']);

  if (response) {
    return response;
  }

  return ok(await listSchedules());
}

export async function POST(request: NextRequest) {
  const { response } = await requireRole(request, ['admin']);

  if (response) {
    return response;
  }

  const parsed = scheduleSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data jadwal tidak valid.', 422);
  }

  try {
    return created(await saveSchedule(parsed.data));
  } catch (error) {
    if (error instanceof RepositoryError) {
      return fail(error.message, error.status);
    }

    return fail(error instanceof Error ? error.message : 'Jadwal gagal disimpan.', 500);
  }
}
