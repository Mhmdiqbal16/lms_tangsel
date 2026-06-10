import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function isValidHttpUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      isValidHttpUrl(process.env.SUPABASE_URL) &&
      !process.env.SUPABASE_URL.includes('your-project-id') &&
      !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service-role-key'),
  );
}

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return client;
}
