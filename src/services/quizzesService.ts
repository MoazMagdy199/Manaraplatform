import { supabase, extractSupabaseError } from '@/lib/supabase'
import type { Quiz, QuizQuestion, QuizResult } from '@/types'

async function fetchQuestionsForQuiz(quizId: string): Promise<QuizQuestion[]> {
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
      isWeekly: row.is_weekly || false,
      grade: row.grade || null,
      groupId: row.group_id || null,
      createdAt: row.created_at,
    })
  }
  return results
}

export async function createQuiz(input: { 
  lessonId: string | null
  title: string
  duration: number
  questions: QuizQuestion[]
  isWeekly?: boolean
  grade?: string | null
  groupId?: string | null
}): Promise<Quiz> {
  const { data: quizRow, error: quizErr } = await supabase
    .from('quizzes')
    .insert({ 
      lesson_id: input.lessonId || null,
      title: input.title, 
      duration_minutes: input.duration,
      is_weekly: input.isWeekly || false,
      grade: input.grade || null,
      group_id: input.groupId || null
    })
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
    lessonId: quizRow.lesson_id || '',
    lessonTitle: quizRow.lesson?.title || 'امتحان شامل',
    title: quizRow.title,
    duration: quizRow.duration_minutes,
    questions,
    isWeekly: quizRow.is_weekly || false,
    grade: quizRow.grade || null,
    groupId: quizRow.group_id || null,
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
  const payload = Object.entries(answers).map(([questionId, selected]) => ({
    question_id: questionId,
    selected,
  }))

  const { data, error } = await supabase.rpc('submit_quiz', { p_quiz_id: quizId, p_answers: payload })
  if (error) throw new Error(extractSupabaseError(error, 'تعذّر تسليم الاختبار'))

  // إرسال الإشعار للمدرس
  try {
    const { data: authData } = await supabase.auth.getUser();
    const studentName = authData.user?.user_metadata?.name || 'طالب';
    const { data: teacher } = await supabase.from('profiles').select('id').eq('role', 'Teacher').limit(1).single();
    const { data: quizData } = await supabase.from('quizzes').select('title').eq('id', quizId).single();

    if (teacher && quizData) {
      await supabase.from('notifications').insert({
        user_id: teacher.id,
        title: 'تسليم اختبار جديد 📝',
        message: `الطالب ${studentName} قام بتسليم اختبار "${quizData.title}" وحصل على ${data.score} من ${data.max_score}`,
        is_read: false
      });
    }
  } catch (notifErr) {
    console.error('Failed to send notification:', notifErr);
  }

  // بعد التسليم، بنمسح سجل المحاولة عشان لو المدرس فتحله الاختبار تاني يبقى محاولة جديدة
  // await supabase.from('quiz_attempts').delete().eq('quiz_id', quizId).eq('student_id', data.student_id)

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

export async function fetchAllQuizResults(): Promise<QuizResult[]> {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('*, quiz_answers(quiz_question_id, selected_answer)')
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

// ==========================================
// 👈 دوال تتبع وقت الامتحان (الجديدة)
// ==========================================

// تسجيل بداية المحاولة
export async function startQuizAttempt(quizId: string, durationMinutes: number) {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('يجب تسجيل الدخول')

  const endsAt = new Date(Date.now() + durationMinutes * 60000).toISOString()

  const { error } = await supabase.from('quiz_attempts').insert({
    quiz_id: quizId,
    student_id: userData.user.id,
    ends_at: endsAt
  })

  if (error && !error.message.includes('duplicate key')) {
    throw new Error(extractSupabaseError(error))
  }
  return endsAt
}

// جلب محاولة الطالب عشان نعرف الوقت المتبقي
export async function getMyQuizAttempt(quizId: string) {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('student_id', userData.user.id)
    .maybeSingle()

  if (error) return null
  return data
}

export type { Quiz }