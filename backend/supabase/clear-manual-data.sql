-- Mengosongkan data demo/operasional agar admin bisa isi manual dari awal.
-- Aman untuk tahap setup/dev: akun role admin tetap dipertahankan.
-- Jalankan di Supabase SQL Editor setelah memastikan minimal ada satu akun admin yang bisa login.

begin;

delete from assessment_student_answers;
delete from assessment_student_statuses;
delete from assessment_questions;
delete from assessments;
delete from teacher_questionnaires;
delete from student_journals;
delete from learning_materials;
delete from student_attendances;
delete from teacher_attendances;
delete from schedules;
delete from teacher_subjects;
delete from students;
delete from classes;
delete from subjects;
delete from teachers;
delete from curricula;

delete from app_users
where role <> 'admin';

delete from admins
where user_id is null
   or not exists (
    select 1
    from app_users
    where app_users.id = admins.user_id
      and app_users.role = 'admin'
  );

commit;
