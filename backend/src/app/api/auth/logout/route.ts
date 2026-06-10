import { clearSession } from '@/lib/auth';
import { ok } from '@/lib/responses';

export async function POST() {
  await clearSession();

  return ok({ success: true });
}
