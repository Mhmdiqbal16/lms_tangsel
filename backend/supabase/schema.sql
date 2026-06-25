create extension if not exists "pgcrypto";

do $$ begin
  create type user_role as enum ('siswa', 'guru', 'kurikulum', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type attendance_status as enum ('Hadir', 'Izin', 'Alfa');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type teacher_attendance_status as enum ('Hadir', 'Izin', 'Belum Presensi');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type validation_status as enum ('Menunggu', 'Valid', 'Ditolak');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type alignment_status as enum ('Sesuai', 'Belum Diisi', 'Perlu Cek');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type assessment_type as enum ('pretest', 'posttest');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type active_status as enum ('Aktif', 'Nonaktif');
exception when duplicate_object then null;
end $$;

create table if not exists app_users (
  id text primary key,
  role user_role not null,
  identifier text not null,
  password_hash text not null,
  name text not null,
  reference_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_role_identifier_key unique (role, identifier)
);

create table if not exists subjects (
  id text primary key,
  name text not null unique,
  short_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists teachers (
  id text primary key,
  user_id text references app_users(id) on delete set null,
  name text not null,
  nip text not null unique,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists teacher_subjects (
  teacher_id text not null references teachers(id) on delete cascade,
  subject_id text not null references subjects(id) on delete cascade,
  primary key (teacher_id, subject_id)
);

create table if not exists classes (
  id text primary key,
  name text not null unique,
  major text not null,
  homeroom_teacher_id text references teachers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists students (
  id text primary key,
  user_id text references app_users(id) on delete set null,
  name text not null,
  nisn text not null unique,
  class_id text not null references classes(id) on delete restrict,
  email text not null,
  avatar text not null default 'NA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists curricula (
  id text primary key,
  user_id text references app_users(id) on delete set null,
  name text not null,
  nip text not null unique,
  employee_id text not null unique,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admins (
  id text primary key,
  user_id text references app_users(id) on delete set null,
  name text not null,
  nip text not null unique,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists schedules (
  id text primary key,
  class_id text not null references classes(id) on delete restrict,
  subject_id text not null references subjects(id) on delete restrict,
  teacher_id text not null references teachers(id) on delete restrict,
  day smallint not null check (day between 1 and 5),
  start_time time not null,
  end_time time not null,
  room text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedules_time_check check (start_time < end_time)
);

create table if not exists teacher_attendances (
  id text primary key,
  teacher_id text not null references teachers(id) on delete restrict,
  schedule_id text not null references schedules(id) on delete restrict,
  date date not null,
  status teacher_attendance_status not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, schedule_id, date)
);

create table if not exists student_attendances (
  id text primary key,
  student_id text not null references students(id) on delete restrict,
  schedule_id text not null references schedules(id) on delete restrict,
  date date not null,
  status attendance_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, schedule_id, date)
);

create table if not exists learning_materials (
  id text primary key,
  teacher_id text not null references teachers(id) on delete restrict,
  schedule_id text not null references schedules(id) on delete restrict,
  date date not null,
  meeting integer not null check (meeting > 0),
  title text not null,
  description text not null,
  validation_status validation_status not null default 'Menunggu',
  alignment_status alignment_status not null default 'Sesuai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (schedule_id, date)
);

create table if not exists assessments (
  id text primary key,
  type assessment_type not null,
  teacher_id text not null references teachers(id) on delete restrict,
  schedule_id text not null references schedules(id) on delete restrict,
  class_id text not null references classes(id) on delete restrict,
  subject_id text not null references subjects(id) on delete restrict,
  date date not null,
  meeting integer not null check (meeting > 0),
  question_count integer not null check (question_count between 1 and 10),
  status active_status not null default 'Aktif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (type, schedule_id, date, meeting)
);

create table if not exists assessment_questions (
  id text primary key,
  assessment_id text not null references assessments(id) on delete cascade,
  question text not null,
  options jsonb not null,
  answer text not null,
  position integer not null check (position > 0),
  created_at timestamptz not null default now()
);

create table if not exists assessment_student_statuses (
  assessment_id text not null references assessments(id) on delete cascade,
  student_id text not null references students(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  score integer not null default 0 check (score >= 0),
  primary key (assessment_id, student_id)
);

create table if not exists assessment_student_answers (
  assessment_id text not null references assessments(id) on delete cascade,
  student_id text not null references students(id) on delete cascade,
  question_id text not null references assessment_questions(id) on delete cascade,
  answer text not null,
  correct boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (assessment_id, student_id, question_id),
  foreign key (assessment_id, student_id) references assessment_student_statuses(assessment_id, student_id) on delete cascade
);

create table if not exists teacher_questionnaires (
  id text primary key,
  student_id text not null references students(id) on delete restrict,
  teacher_id text not null references teachers(id) on delete restrict,
  schedule_id text not null references schedules(id) on delete restrict,
  date date not null,
  completed boolean not null default false,
  ratings jsonb not null default '{}'::jsonb,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, teacher_id, schedule_id, date)
);

create table if not exists student_journals (
  id text primary key,
  student_id text not null references students(id) on delete restrict,
  schedule_id text not null references schedules(id) on delete restrict,
  date date not null,
  material_studied text not null,
  summary text not null,
  tasks text not null,
  learning_obstacles text not null,
  attachment_name text,
  attachment_path text,
  attachment_size bigint,
  attachment_type text,
  entry_status text not null default 'Selesai',
  review_status text not null default 'Menunggu Review',
  notes text not null default 'Menunggu review guru.',
  validation_status validation_status not null default 'Menunggu',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, schedule_id, date)
);

create index if not exists idx_students_class_id on students(class_id);
create index if not exists idx_schedules_class_day on schedules(class_id, day);
create index if not exists idx_schedules_teacher_day on schedules(teacher_id, day);
create index if not exists idx_teacher_attendances_date on teacher_attendances(date);
create index if not exists idx_student_attendances_student_date on student_attendances(student_id, date);
create index if not exists idx_learning_materials_schedule_date on learning_materials(schedule_id, date);
create index if not exists idx_student_journals_student_date on student_journals(student_id, date);
create index if not exists idx_student_journals_schedule_date on student_journals(schedule_id, date);

insert into storage.buckets (id, name, public)
values ('journal-attachments', 'journal-attachments', false)
on conflict (id) do update set public = false;

alter table app_users enable row level security;
alter table subjects enable row level security;
alter table teachers enable row level security;
alter table teacher_subjects enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table curricula enable row level security;
alter table admins enable row level security;
alter table schedules enable row level security;
alter table teacher_attendances enable row level security;
alter table student_attendances enable row level security;
alter table learning_materials enable row level security;
alter table assessments enable row level security;
alter table assessment_questions enable row level security;
alter table assessment_student_statuses enable row level security;
alter table assessment_student_answers enable row level security;
alter table teacher_questionnaires enable row level security;
alter table student_journals enable row level security;
