import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

function readEnvFile(filePath) {
  const env = {};

  if (!fs.existsSync(filePath)) {
    return env;
  }

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!match) {
      continue;
    }

    env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
  }

  return env;
}

function assertConfigured(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di backend/.env.local.');
  }

  const url = new URL(env.SUPABASE_URL);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('SUPABASE_URL harus berupa URL http/https.');
  }
}

async function deleteAll(supabase, table, column) {
  const { error } = await supabase.from(table).delete().neq(column, '__never__');

  if (error) {
    throw new Error(`Gagal menghapus ${table}: ${error.message}`);
  }
}

const env = readEnvFile(envPath);
assertConfigured(env);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const deleteSteps = [
  ['assessment_student_answers', 'assessment_id'],
  ['assessment_student_statuses', 'assessment_id'],
  ['assessment_questions', 'id'],
  ['assessments', 'id'],
  ['teacher_questionnaires', 'id'],
  ['student_journals', 'id'],
  ['learning_materials', 'id'],
  ['student_attendances', 'id'],
  ['teacher_attendances', 'id'],
  ['schedules', 'id'],
  ['teacher_subjects', 'teacher_id'],
  ['students', 'id'],
  ['classes', 'id'],
  ['subjects', 'id'],
  ['teachers', 'id'],
  ['curricula', 'id'],
];

for (const [table, column] of deleteSteps) {
  await deleteAll(supabase, table, column);
}

const { error: userDeleteError } = await supabase.from('app_users').delete().neq('role', 'admin');
if (userDeleteError) {
  throw new Error(`Gagal menghapus akun non-Super Admin: ${userDeleteError.message}`);
}

const { data: adminUsers, error: adminUserError } = await supabase.from('app_users').select('id').eq('role', 'admin');
if (adminUserError) {
  throw new Error(`Gagal mengambil akun Super Admin: ${adminUserError.message}`);
}

const adminUserIds = new Set((adminUsers ?? []).map((item) => item.id));
const { data: adminProfiles, error: adminProfileError } = await supabase.from('admins').select('id,user_id');
if (adminProfileError) {
  throw new Error(`Gagal mengambil profil Super Admin: ${adminProfileError.message}`);
}

for (const profile of adminProfiles ?? []) {
  if (!profile.user_id || !adminUserIds.has(profile.user_id)) {
    const { error } = await supabase.from('admins').delete().eq('id', profile.id);
    if (error) {
      throw new Error(`Gagal menghapus profil Super Admin ${profile.id}: ${error.message}`);
    }
  }
}

console.log('Data manual berhasil dikosongkan. Akun Super Admin tetap dipertahankan.');
