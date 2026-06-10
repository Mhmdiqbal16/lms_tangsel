import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { publicUser, requireRole } from '@/lib/auth';
import { createAccount, deleteAccount, listUsers, RepositoryError } from '@/lib/repository';
import { created, fail, ok } from '@/lib/responses';

const accountSchema = z.object({
  role: z.enum(['siswa', 'guru', 'kurikulum', 'admin']),
  identifier: z.string().min(3),
  password: z.string().min(6),
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  referenceId: z.string().optional(),
  classId: z.string().optional(),
  employeeId: z.string().optional(),
  subjectIds: z.array(z.string()).optional(),
});

const deleteAccountSchema = z.object({
  id: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const { response } = await requireRole(request, ['admin']);

  if (response) {
    return response;
  }

  const users = await listUsers();
  return ok(users.map(publicUser));
}

export async function POST(request: NextRequest) {
  const { response } = await requireRole(request, ['admin']);

  if (response) {
    return response;
  }

  const parsed = accountSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data akun tidak valid. Pastikan role, nama, identitas, dan password sudah diisi.', 422);
  }

  try {
    const user = await createAccount({
      ...parsed.data,
      email: parsed.data.email || undefined,
    });

    return created(publicUser(user));
  } catch (error) {
    if (error instanceof RepositoryError) {
      return fail(error.message, error.status);
    }

    return fail(error instanceof Error ? error.message : 'Akun gagal dibuat.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const { user, response } = await requireRole(request, ['admin']);

  if (response) {
    return response;
  }

  if (!user) {
    return fail('Unauthenticated.', 401);
  }

  const parsed = deleteAccountSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data akun tidak valid.', 422);
  }

  try {
    await deleteAccount(parsed.data.id, user.id);
    return ok({ success: true });
  } catch (error) {
    if (error instanceof RepositoryError) {
      return fail(error.message, error.status);
    }

    return fail(error instanceof Error ? error.message : 'Akun gagal dihapus.', 500);
  }
}
