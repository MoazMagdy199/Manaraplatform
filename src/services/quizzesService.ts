import { supabase, extractSupabaseError } from '@/lib/supabase'
import type { Quiz, QuizQuestion, QuizResult } from '@/types'

async function fetchQuestionsForQuiz(quizId: string): Promise<QuizQuestion[]> {
  // This RPC hides correct_answer from a student until they've completed
  // the quiz (or reveals it always for a teacher) — enforced server-side.
  const { data, error } = await supabase.rpc('get_quiz_questions_for_student', { p_quiz_id: quizId })
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []).map((q: any) => ({
    id: q.id,
    question: q.question,
    options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
    correctAnswer: q.correct_answer ?? 'A',
    points: q.points,
  }))
}

export async function fetchQuizzes(): Promise<Quiz[]> {
  const { data: quizzes, error } = await supabase
    .from('quizzes')
    .select('*, lesson:lessons(title)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(extractSupabaseError(error))

  const results: Quiz[] = []
  for (const row of quizzes || []) {
    const questions = await fetchQuestionsForQuiz(row.id)
    results.push({
      id: row.id,
      lessonId: row.lesson_id,
      lessonTitle: row.lesson?.title || '',
      title: row.title,
      duration: row.duration_minutes,
      questions,
      createdAt: row.created_at,
    })
  }
  return results
}

export async function createQuiz(input: { lessonId: string; title: string; duration: number; questions: QuizQuestion[] }): Promise<Quiz> {
  const { data: quizRow, error: quizErr } = await supabase
    .from('quizzes')
    .insert({ lesson_id: input.lessonId, title: input.title, duration_minutes: input.duration })
    .select('*, lesson:lessons(title)')
    .single()
  if (quizErr) throw new Error(extractSupabaseError(quizErr))

  const questionRows = input.questions.map((q) => ({
    quiz_id: quizRow.id,
    question: q.question,
    option_a: q.options.A,
    option_b: q.options.B,
    option_c: q.options.C,
    option_d: q.options.D,
    correct_answer: q.correctAnswer,
    points: q.points,
  }))
  const { error: questionsErr } = await supabase.from('quiz_questions').insert(questionRows)
  if (questionsErr) throw new Error(extractSupabaseError(questionsErr))

  const questions = await fetchQuestionsForQuiz(quizRow.id)
  return {
    id: quizRow.id,
    lessonId: quizRow.lesson_id,
    lessonTitle: quizRow.lesson?.title || '',
    title: quizRow.title,
    duration: quizRow.duration_minutes,
    questions,
    createdAt: quizRow.created_at,
  }
}

export async function deleteQuiz(id: string): Promise<void> {
  const { error } = await supabase.from('quizzes').delete().eq('id', id)
  if (error) throw new Error(extractSupabaseError(error))
}

export async function fetchMyQuizResults(): Promise<QuizResult[]> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data, error } = await supabase
    .from('quiz_results')
    .select('*, quiz_answers(quiz_question_id, selected_answer)')
    .eq('student_id', userData.user.id)
  if (error) throw new Error(extractSupabaseError(error))

  return (data || []).map((row: any) => ({
    id: row.id,
    quizId: row.quiz_id,
    studentId: row.student_id,
    score: row.score,
    maxScore: row.max_score,
    submittedAt: row.submitted_at,
    answers: Object.fromEntries(
      (row.quiz_answers || []).map((a: any) => [a.quiz_question_id, a.selected_answer]),
    ),
  }))
}

export async function submitQuiz(quizId: string, answers: Record<string, 'A' | 'B' | 'C' | 'D'>): Promise<QuizResult> {
  // Scoring happens entirely server-side inside this function — the client
  // never computes or sends a score, so it can't be forged.
  const payload = Object.entries(answers).map(([questionId, selected]) => ({
    question_id: questionId,
    selected,
  }))

  const { data, error } = await supabase.rpc('submit_quiz', { p_quiz_id: quizId, p_answers: payload })
  if (error) throw new Error(extractSupabaseError(error, 'تعذّر تسليم الاختبار'))

  return {
    id: data.id,
    quizId: data.quiz_id,
    studentId: data.student_id,
    score: data.score,
    maxScore: data.max_score,
    submittedAt: data.submitted_at,
    answers,
  }
}

export type { Quiz }
