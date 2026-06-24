-- Tambahkan detail hasil kuisioner guru untuk database yang sudah berjalan.

alter table teacher_questionnaires
  add column if not exists ratings jsonb not null default '{}'::jsonb,
  add column if not exists note text not null default '';
