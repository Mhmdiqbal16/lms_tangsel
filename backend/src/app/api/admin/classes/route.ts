import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { listClasses, RepositoryError, saveClass } from '@/lib/repository';
import { created, fail, ok } from '@/lib/responses';

const classSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  major: z.string().min(1),
  homeroomTeacherId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { response } = await requireRole(request, ['admin']);

  if (response) {
    return response;
  }

  return ok(await listClasses());
}

export async function POST(request: NextRequest) {
  const { response } = await requireRole(request, ['admin']);

  if (response) {
    return response;
  }

  const parsed = classSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data kelas tidak valid.', 422);
  }

  try {
    return created(await saveClass(parsed.data));
  } catch (error) {
    if (error instanceof RepositoryError) {
      return fail(error.message, error.status);
    }

    return fail(error instanceof Error ? error.message : 'Kelas gagal disimpan.', 500);
  }
}
