import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import {
  createAssessments,
  getAssessment,
  getRepositoryDateOrAcademicToday,
  getScheduleById,
  getStudentsForClass,
  parseRepositoryISODate,
  RepositoryError,
} from '@/lib/repository';
import { created, fail } from '@/lib/responses';
import type { AssessmentQuestion, AssessmentRecord } from '@/types/domain';

const questionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  answer: z.string().min(1),
});

const assessmentBundleSchema = z.object({
  teacherId: z.string().min(1).optional(),
  scheduleId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  classId: z.string().min(1),
  subjectId: z.string().min(1),
  meeting: z.number().int().positive(),
  status: z.enum(['Aktif', 'Nonaktif']),
  pretestQuestions: z.array(questionSchema).min(1).max(10),
  posttestQuestions: z.array(questionSchema).min(1).max(10),
});

function getInvalidAnswerMessage(label: string, questions: z.infer<typeof questionSchema>[]) {
  const invalidIndex = questions.findIndex((question) => !question.options.includes(question.answer));
  return invalidIndex >= 0 ? `${label} nomor ${invalidIndex + 1} memiliki kunci jawaban di luar opsi.` : null;
}

function buildQuestions(prefix: string, questions: z.infer<typeof questionSchema>[]): AssessmentQuestion[] {
  const timestamp = Date.now();
  return questions.map((question, index) => ({
    id: `${prefix}-question-${timestamp}-${index + 1}`,
    question: question.question.trim(),
    options: question.options.map((option) => option.trim()),
    answer: question.answer.trim(),
  }));
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireRole(request, ['guru']);

  if (response) {
    return response;
  }

  const parsed = assessmentBundleSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data assessment tidak valid.', 422);
  }

  const teacherId = user.referenceId;
  if (parsed.data.teacherId && parsed.data.teacherId !== teacherId) {
    return fail('Guru hanya dapat membuat assessment untuk akun yang sedang login.', 403);
  }

  const schedule = await getScheduleById(parsed.data.scheduleId);

  if (!schedule || schedule.teacherId !== teacherId) {
    return fail('Jadwal tidak ditemukan untuk guru ini.', 403);
  }

  if (schedule.classId !== parsed.data.classId || schedule.subjectId !== parsed.data.subjectId) {
    return fail('Kelas atau mata pelajaran tidak sesuai dengan jadwal.', 422);
  }

  const date = getRepositoryDateOrAcademicToday(parsed.data.date);
  if (schedule.day !== parseRepositoryISODate(date).getDay()) {
    return fail('Assessment hanya dapat dibuat sesuai hari pada jadwal mengajar.', 403);
  }

  const answerError =
    getInvalidAnswerMessage('Pretest', parsed.data.pretestQuestions) ??
    getInvalidAnswerMessage('Posttest', parsed.data.posttestQuestions);

  if (answerError) {
    return fail(answerError, 422);
  }

  const duplicatePretest = await getAssessment({
    type: 'pretest',
    scheduleId: schedule.id,
    date,
    meeting: parsed.data.meeting,
  });
  const duplicatePosttest = await getAssessment({
    type: 'posttest',
    scheduleId: schedule.id,
    date,
    meeting: parsed.data.meeting,
  });

  if (duplicatePretest || duplicatePosttest) {
    return fail('Assessment untuk pertemuan ini sudah tersedia.', 409);
  }

  const classStudents = await getStudentsForClass(schedule.classId);
  const buildStudentStatuses = () =>
    classStudents.map((student) => ({
      studentId: student.id,
      completed: false,
    }));
  const timestamp = Date.now();
  const pretestQuestions = buildQuestions('pretest', parsed.data.pretestQuestions);
  const posttestQuestions = buildQuestions('posttest', parsed.data.posttestQuestions);

  const pretest: AssessmentRecord = {
    id: `asm-pre-${teacherId}-${timestamp}`,
    type: 'pretest',
    teacherId,
    scheduleId: schedule.id,
    classId: schedule.classId,
    subjectId: schedule.subjectId,
    date,
    meeting: parsed.data.meeting,
    questionCount: pretestQuestions.length,
    status: parsed.data.status,
    questions: pretestQuestions,
    studentStatuses: buildStudentStatuses(),
  };

  const posttest: AssessmentRecord = {
    id: `asm-post-${teacherId}-${timestamp}`,
    type: 'posttest',
    teacherId,
    scheduleId: schedule.id,
    classId: schedule.classId,
    subjectId: schedule.subjectId,
    date,
    meeting: parsed.data.meeting,
    questionCount: posttestQuestions.length,
    status: parsed.data.status,
    questions: posttestQuestions,
    studentStatuses: buildStudentStatuses(),
  };

  try {
    return created(await createAssessments([pretest, posttest]));
  } catch (error) {
    if (error instanceof RepositoryError) {
      return fail(error.message, error.status);
    }

    return fail(error instanceof Error ? error.message : 'Assessment gagal disimpan.', 500);
  }
}
