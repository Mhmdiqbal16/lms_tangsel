import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { deleteMasterData, RepositoryError } from '@/lib/repository';
import { fail, ok } from '@/lib/responses';

const deleteSchema = z.object({
  kind: z.enum(['student', 'teacher', 'class', 'subject', 'schedule']),
  id: z.string().min(1),
});

export async function DELETE(request: NextRequest) {
  const { response } = await requireRole(request, ['admin']);

  if (response) {
    return response;
  }

  const parsed = deleteSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data hapus tidak valid.', 422);
  }

  try {
    await deleteMasterData(parsed.data.kind, parsed.data.id);
    return ok({ success: true });
  } catch (error) {
    if (error instanceof RepositoryError) {
      return fail(error.message, error.status);
    }

    return fail(error instanceof Error ? error.message : 'Data gagal dihapus.', 500);
  }
}
