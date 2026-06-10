-- Jalankan sekali pada database Supabase yang sudah ada.
-- Tujuannya: NIP/username yang sama boleh dipakai di role berbeda,
-- misalnya satu nama/NIP pernah ada di guru dan ingin dibuat juga sebagai kurikulum.

alter table app_users
  drop constraint if exists app_users_identifier_key;

alter table app_users
  drop constraint if exists app_users_role_identifier_key;

alter table app_users
  add constraint app_users_role_identifier_key unique (role, identifier);
