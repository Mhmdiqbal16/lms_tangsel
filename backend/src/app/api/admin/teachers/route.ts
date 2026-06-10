import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { listTeachers, RepositoryError, saveTeacher } from '@/lib/repository';
import { created, fail, ok } from '@/lib/responses';

const teacherSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  nip: z.string().min(1),
  email: z.string().email(),
  subjectIds: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  const { response } = await requireRole(request, ['admin']);

  if (response) {
    return response;
  }

  return ok(await listTeachers());
}

export async function POST(request: NextRequest) {
  const { response } = await requireRole(request, ['admin']);

  if (response) {
    return response;
  }

  const parsed = teacherSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data guru tidak valid.', 422);
  }

  try {
    return created(await saveTeacher(parsed.data));
  } catch (error) {
    if (error instanceof RepositoryError) {
      return fail(error.message, error.status);
    }

    return fail(error instanceof Error ? error.message : 'Guru gagal disimpan.', 500);
  }
}
