import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { listStudents, RepositoryError, saveStudent } from '@/lib/repository';
import { created, fail, ok } from '@/lib/responses';

const studentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  nisn: z.string().min(1),
  classId: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  avatar: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { response } = await requireRole(request, ['admin']);

  if (response) {
    return response;
  }

  return ok(await listStudents());
}

export async function POST(request: NextRequest) {
  const { response } = await requireRole(request, ['admin']);

  if (response) {
    return response;
  }

  const parsed = studentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data siswa tidak valid.', 422);
  }

  try {
    return created(await saveStudent(parsed.data));
  } catch (error) {
    if (error instanceof RepositoryError) {
      return fail(error.message, error.status);
    }

    return fail(error instanceof Error ? error.message : 'Siswa gagal disimpan.', 500);
  }
}
