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

alter table assessment_student_answers enable row level security;
