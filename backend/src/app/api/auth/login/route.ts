import { z } from 'zod';
import { authResponse, createSession } from '@/lib/auth';
import { findUserForLogin } from '@/lib/repository';
import { fail, ok } from '@/lib/responses';

const loginSchema = z.object({
  identifier: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  password: z.string().min(1),
}).refine((value) => value.identifier || value.email);

function isSupabaseConnectionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT/i.test(error.message);
}

function authServiceError(error: unknown) {
  console.error(error);

  if (isSupabaseConnectionError(error)) {
    return fail(
      'Server tidak bisa terhubung ke Supabase. Periksa koneksi internet/DNS dan SUPABASE_URL di backend/.env.local.',
      503,
    );
  }

  return fail(error instanceof Error ? error.message : 'Login gagal diproses.', 500);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return fail('Payload login harus berupa JSON valid.', 422);
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return fail('NISN/NIP atau password tidak valid.', 422);
  }

  try {
    const identifier = (parsed.data.identifier ?? parsed.data.email ?? '').trim();
    const user = await findUserForLogin(identifier, parsed.data.password);

    if (!user) {
      return fail('NISN/NIP atau password salah.', 401);
    }

    await createSession(user.id);

    return ok(await authResponse(user));
  } catch (error) {
    return authServiceError(error);
  }
}
