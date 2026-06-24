import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { completeAssessmentForStudent, getAssessmentById, getStudentJournal } from '@/lib/repository';
import { fail, ok } from '@/lib/responses';

const completeAssessmentSchema = z.object({
  assessmentId: z.string().min(1),
  studentId: z.string().min(1).optional(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      answer: z.string().min(1),
    }),
  ),
});

export async function POST(request: NextRequest) {
  const { user, response } = await requireRole(request, ['siswa']);

  if (response) {
    return response;
  }

  const parsed = completeAssessmentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail('Data penyelesaian assessment tidak valid.', 422);
  }

  const studentId = user.referenceId;
  if (parsed.data.studentId && parsed.data.studentId !== studentId) {
    return fail('Siswa hanya dapat menyelesaikan assessment untuk akun sendiri.', 403);
  }

  const assessment = await getAssessmentById(parsed.data.assessmentId);
  if (!assessment) {
    return fail('Assessment tidak ditemukan.', 404);
  }

  if (!assessment.studentStatuses.some((status) => status.studentId === studentId)) {
    return fail('Assessment tidak tersedia untuk siswa ini.', 403);
  }

  const answerMap = new Map(parsed.data.answers.map((answer) => [answer.questionId, answer.answer]));
  const missingAnswer = assessment.questions.find((question) => !answerMap.get(question.id));
  if (missingAnswer) {
    return fail('Lengkapi seluruh jawaban assessment sebelum mengumpulkan.', 422);
  }

  const invalidAnswer = assessment.questions.find((question) => !question.options.includes(answerMap.get(question.id) ?? ''));
  if (invalidAnswer) {
    return fail('Terdapat jawaban assessment yang tidak sesuai opsi soal.', 422);
  }

  if (assessment.type === 'posttest') {
    const journal = await getStudentJournal({
      studentId,
      scheduleId: assessment.scheduleId,
      date: assessment.date,
    });

    if (!journal) {
      return fail('Kirim jurnal terlebih dahulu sebelum mengerjakan posttest.', 403);
    }
  }

  const updatedAssessment = await completeAssessmentForStudent(parsed.data.assessmentId, studentId, parsed.data.answers);
  if (!updatedAssessment) {
    return fail('Assessment tidak ditemukan.', 404);
  }

  return ok(updatedAssessment);
}
