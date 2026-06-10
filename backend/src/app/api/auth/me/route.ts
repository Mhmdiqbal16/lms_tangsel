import type { NextRequest } from 'next/server';
import { authResponse, requireUser } from '@/lib/auth';
import { fail, ok } from '@/lib/responses';

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

  return fail(error instanceof Error ? error.message : 'Sesi gagal diperiksa.', 500);
}

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireUser(request);

    if (response) {
      return response;
    }

    return ok(await authResponse(user));
  } catch (error) {
    return authServiceError(error);
  }
}
