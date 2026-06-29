insert into subjects (id, name, short_name) values
  ('sub-bd', 'Basis Data', 'BD'),
  ('sub-pbo', 'Pemrograman Berorientasi Objek', 'PBO'),
  ('sub-jardas', 'Jaringan Dasar', 'Jardas'),
  ('sub-mtk', 'Matematika', 'MTK'),
  ('sub-bind', 'Bahasa Indonesia', 'B. Indo')
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  updated_at = now();

insert into app_users (id, role, identifier, password_hash, name, reference_id) values
  ('user-siswa-1', 'siswa', '0067458123', encode(digest('alya2026', 'sha256'), 'hex'), 'Alya Putri Ramadhani', 'std-1'),
  ('user-guru-1', 'guru', '198906122018011001', encode(digest('budi2026', 'sha256'), 'hex'), 'Budi Santoso, S.Kom.', 't-1'),
  ('user-kurikulum-1', 'kurikulum', '197905182010012003', encode(digest('rina2026', 'sha256'), 'hex'), 'Rina Wulandari, M.Pd.', 'kur-1'),
  ('user-admin-1', 'admin', '197912102009011001', encode(digest('admin2026', 'sha256'), 'hex'), 'Super Admin Sekolah', 'adm-1')
on conflict (id) do update set
  role = excluded.role,
  identifier = excluded.identifier,
  password_hash = excluded.password_hash,
  name = excluded.name,
  reference_id = excluded.reference_id,
  updated_at = now();

insert into teachers (id, user_id, name, nip, email) values
  ('t-1', 'user-guru-1', 'Budi Santoso, S.Kom.', '198906122018011001', 'budi.santoso@smkn2.sch.id'),
  ('t-2', null, 'Anita Rahmawati, S.Pd.', '198802142017022004', 'anita.rahmawati@smkn2.sch.id'),
  ('t-3', null, 'Dedi Saputra, S.Kom.', '198704102016031005', 'dedi.saputra@smkn2.sch.id'),
  ('t-4', null, 'Lilis Wahyuni, S.Pd.', '198511202014012002', 'lilis.wahyuni@smkn2.sch.id')
on conflict (id) do update set
  user_id = excluded.user_id,
  name = excluded.name,
  nip = excluded.nip,
  email = excluded.email,
  updated_at = now();

insert into teacher_subjects (teacher_id, subject_id) values
  ('t-1', 'sub-bd'),
  ('t-1', 'sub-pbo'),
  ('t-2', 'sub-mtk'),
  ('t-3', 'sub-jardas'),
  ('t-4', 'sub-bind')
on conflict do nothing;

insert into classes (id, name, major, homeroom_teacher_id) values
  ('cls-xirpl1', 'XI RPL 1', 'Rekayasa Perangkat Lunak', 't-1'),
  ('cls-xirpl2', 'XI RPL 2', 'Rekayasa Perangkat Lunak', 't-3')
on conflict (id) do update set
  name = excluded.name,
  major = excluded.major,
  homeroom_teacher_id = excluded.homeroom_teacher_id,
  updated_at = now();

insert into students (id, user_id, name, nisn, class_id, email, avatar) values
  ('std-1', 'user-siswa-1', 'Alya Putri Ramadhani', '0067458123', 'cls-xirpl1', 'alya@smkn2.sch.id', 'AP'),
  ('std-2', null, 'Dimas Pratama', '0067458124', 'cls-xirpl1', 'dimas@smkn2.sch.id', 'DP'),
  ('std-3', null, 'Nabila Salsabila', '0067458125', 'cls-xirpl1', 'nabila@smkn2.sch.id', 'NS'),
  ('std-4', null, 'Farhan Akbar', '0067458126', 'cls-xirpl2', 'farhan@smkn2.sch.id', 'FA'),
  ('std-5', null, 'Siti Nuraini', '0067458127', 'cls-xirpl2', 'siti@smkn2.sch.id', 'SN'),
  ('std-6', null, 'Raka Maulana', '0067458128', 'cls-xirpl2', 'raka@smkn2.sch.id', 'RM')
on conflict (id) do update set
  user_id = excluded.user_id,
  name = excluded.name,
  nisn = excluded.nisn,
  class_id = excluded.class_id,
  email = excluded.email,
  avatar = excluded.avatar,
  updated_at = now();

insert into curricula (id, user_id, name, nip, employee_id, email) values
  ('kur-1', 'user-kurikulum-1', 'Rina Wulandari, M.Pd.', '197905182010012003', 'KUR-2026-01', 'rina.wulandari@smkn2.sch.id')
on conflict (id) do update set
  user_id = excluded.user_id,
  name = excluded.name,
  nip = excluded.nip,
  employee_id = excluded.employee_id,
  email = excluded.email,
  updated_at = now();

insert into admins (id, user_id, name, nip, email) values
  ('adm-1', 'user-admin-1', 'Super Admin Sekolah', '197912102009011001', 'admin@smkn2.sch.id')
on conflict (id) do update set
  user_id = excluded.user_id,
  name = excluded.name,
  nip = excluded.nip,
  email = excluded.email,
  updated_at = now();

insert into schedules (id, class_id, subject_id, teacher_id, day, start_time, end_time, room) values
  ('sch-rpl1-mon-bd', 'cls-xirpl1', 'sub-bd', 't-1', 1, '07:00', '08:40', 'Lab RPL 1'),
  ('sch-rpl1-mon-mtk', 'cls-xirpl1', 'sub-mtk', 't-2', 1, '09:00', '10:40', 'Ruang XI RPL 1'),
  ('sch-rpl1-tue-pbo', 'cls-xirpl1', 'sub-pbo', 't-1', 2, '07:00', '08:40', 'Lab RPL 1'),
  ('sch-rpl1-tue-bind', 'cls-xirpl1', 'sub-bind', 't-4', 2, '09:00', '10:40', 'Ruang XI RPL 1'),
  ('sch-rpl1-wed-bd', 'cls-xirpl1', 'sub-bd', 't-1', 3, '07:00', '08:40', 'Lab Basis Data'),
  ('sch-rpl1-wed-jardas', 'cls-xirpl1', 'sub-jardas', 't-3', 3, '09:00', '10:40', 'Lab Jaringan'),
  ('sch-rpl1-thu-bd', 'cls-xirpl1', 'sub-bd', 't-1', 4, '07:00', '08:40', 'Lab Basis Data'),
  ('sch-rpl1-thu-mtk', 'cls-xirpl1', 'sub-mtk', 't-2', 4, '09:00', '10:40', 'Ruang XI RPL 1'),
  ('sch-rpl1-fri-pbo', 'cls-xirpl1', 'sub-pbo', 't-1', 5, '07:00', '08:40', 'Lab RPL 1'),
  ('sch-rpl1-fri-bind', 'cls-xirpl1', 'sub-bind', 't-4', 5, '09:00', '10:40', 'Ruang XI RPL 1'),
  ('sch-rpl2-mon-pbo', 'cls-xirpl2', 'sub-pbo', 't-1', 1, '10:50', '12:30', 'Lab RPL 2'),
  ('sch-rpl2-tue-mtk', 'cls-xirpl2', 'sub-mtk', 't-2', 2, '10:50', '12:30', 'Ruang XI RPL 2'),
  ('sch-rpl2-wed-bd', 'cls-xirpl2', 'sub-bd', 't-1', 3, '10:50', '12:30', 'Lab Basis Data'),
  ('sch-rpl2-thu-jardas', 'cls-xirpl2', 'sub-jardas', 't-3', 4, '10:50', '12:30', 'Lab Jaringan'),
  ('sch-rpl2-fri-pbo', 'cls-xirpl2', 'sub-pbo', 't-1', 5, '10:50', '12:30', 'Lab RPL 2')
on conflict (id) do update set
  class_id = excluded.class_id,
  subject_id = excluded.subject_id,
  teacher_id = excluded.teacher_id,
  day = excluded.day,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  room = excluded.room,
  updated_at = now();
