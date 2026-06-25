alter table assessment_student_statuses
  add column if not exists score integer not null default 0 check (score >= 0);

update assessment_student_statuses status
set score = answer_summary.correct_count
from (
  select assessment_id, student_id, count(*) filter (where correct) as correct_count
  from assessment_student_answers
  group by assessment_id, student_id
) answer_summary
where status.assessment_id = answer_summary.assessment_id
  and status.student_id = answer_summary.student_id;
