import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import {
  RepositoryError,
  updateLearningMaterialValidation,
  updateStudentJournalValidation,
} from '@/lib/repository';
import { fail, ok } from '@/lib/responses';

const validationSchema = z.object({
  source: z.enum(['journal', 'material']),
  sourceId: z.string().min(1),
  status: z.enum(['Valid', 'Ditolak']),
});

export async function POST(request: NextRequest) {
  const { response } = await requireRole(request, ['kurikulum']);

  if (response) {
    return response;
  }

  const parsed = validationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data validasi tidak valid.', 422);
  }

  try {
    const item =
      parsed.data.source === 'journal'
        ? await updateStudentJournalValidation(parsed.data.sourceId, parsed.data.status)
        : await updateLearningMaterialValidation(parsed.data.sourceId, parsed.data.status);

    return ok({
      source: parsed.data.source,
      item,
    });
  } catch (error) {
    if (error instanceof RepositoryError) {
      return fail(error.message, error.status);
    }

    return fail(error instanceof Error ? error.message : 'Validasi data gagal disimpan.', 500);
  }
}
