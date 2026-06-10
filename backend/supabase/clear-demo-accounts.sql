-- Gunakan setelah schema.sql dan seed.sql berhasil.
-- File ini menghapus akun demo dari app_users, lalu menyisakan satu akun admin setup.
-- Profil siswa/guru/kurikulum/admin demo tetap ada sebagai data master, tetapi tidak bisa login sampai dibuatkan akun baru dari menu Admin.

create extension if not exists "pgcrypto";

insert into app_users (id, role, identifier, password_hash, name, reference_id)
values (
  'user-admin-bootstrap',
  'admin',
  '000000000000000000',
  encode(digest('admin12345', 'sha256'), 'hex'),
  'Admin Setup',
  'adm-bootstrap'
)
on conflict (id) do update set
  role = excluded.role,
  identifier = excluded.identifier,
  password_hash = excluded.password_hash,
  name = excluded.name,
  reference_id = excluded.reference_id,
  updated_at = now();

insert into admins (id, user_id, name, nip, email)
values (
  'adm-bootstrap',
  'user-admin-bootstrap',
  'Admin Setup',
  '000000000000000000',
  'admin.setup@smkn2.local'
)
on conflict (id) do update set
  user_id = excluded.user_id,
  name = excluded.name,
  nip = excluded.nip,
  email = excluded.email,
  updated_at = now();

delete from app_users
where id in (
  'user-siswa-1',
  'user-guru-1',
  'user-kurikulum-1',
  'user-admin-1'
);
