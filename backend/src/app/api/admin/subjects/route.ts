import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { listSubjects, RepositoryError, saveSubject } from '@/lib/repository';
import { created, fail, ok } from '@/lib/responses';

const subjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  shortName: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const { response } = await requireRole(request, ['admin']);

  if (response) {
    return response;
  }

  return ok(await listSubjects());
}

export async function POST(request: NextRequest) {
  const { response } = await requireRole(request, ['admin']);

  if (response) {
    return response;
  }

  const parsed = subjectSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data mata pelajaran tidak valid.', 422);
  }

  try {
    return created(await saveSubject(parsed.data));
  } catch (error) {
    if (error instanceof RepositoryError) {
      return fail(error.message, error.status);
    }

    return fail(error instanceof Error ? error.message : 'Mata pelajaran gagal disimpan.', 500);
  }
}
