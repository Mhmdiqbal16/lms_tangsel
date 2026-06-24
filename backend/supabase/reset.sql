-- Gunakan hanya kalau database Supabase masih tahap setup/dev.
-- File ini menghapus tabel aplikasi agar schema.sql bisa dibuat ulang dengan tipe ID text.

drop table if exists assessment_student_answers cascade;
drop table if exists assessment_student_statuses cascade;
drop table if exists assessment_questions cascade;
drop table if exists assessments cascade;
drop table if exists teacher_questionnaires cascade;
drop table if exists student_journals cascade;
drop table if exists learning_materials cascade;
drop table if exists student_attendances cascade;
drop table if exists teacher_attendances cascade;
drop table if exists schedules cascade;
drop table if exists students cascade;
drop table if exists admins cascade;
drop table if exists curricula cascade;
drop table if exists classes cascade;
drop table if exists teacher_subjects cascade;
drop table if exists teachers cascade;
drop table if exists subjects cascade;
drop table if exists app_users cascade;

drop type if exists active_status cascade;
drop type if exists assessment_type cascade;
drop type if exists alignment_status cascade;
drop type if exists validation_status cascade;
drop type if exists teacher_attendance_status cascade;
drop type if exists attendance_status cascade;
drop type if exists user_role cascade;
