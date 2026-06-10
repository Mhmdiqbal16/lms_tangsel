import { ok } from '@/lib/responses';
import { isSupabaseConfigured } from '@/lib/supabase';

export function GET() {
  return ok({
    status: 'ok',
    service: 'web-smkn2-next-backend',
    supabaseConfigured: isSupabaseConfigured(),
    timestamp: new Date().toISOString(),
  });
}
