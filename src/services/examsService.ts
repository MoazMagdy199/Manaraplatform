import { supabase, extractSupabaseError } from '@/lib/supabase'

export interface Exam {
  id: string
  title: string
  maxScore: number
  examDate: string
  createdAt: string
  scoredCount: number
  totalStudents: number
}

export interface ExamScoreRow {
  studentId: string
  name: string
  username: string
  score: number | null
}

export interface MyExamResult {
  examId: string
  title: string
  maxScore: number
  examDate: string
  score: number | null
}

/** قائمة امتحانات صف معيّن (للمدرس) مع عدد الطلاب المصحَّحين */
export async function fetchExamsForGrade(grade: string): Promise<Exam[]> {
  const { data, error } = await supabase.rpc('get_exams_for_grade', { p_grade: grade })
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    maxScore: Number(e.max_score),
    examDate: e.exam_date,
    createdAt: e.created_at,
    scoredCount: Number(e.scored_count),
    totalStudents: Number(e.total_students),
  }))
}

/** ينشئ امتحان جديد لصف معيّن */
export async function createExam(grade: string, title: string, maxScore: number, examDate: string): Promise<void> {
  const { error } = await supabase.from('exams').insert({ grade, title, max_score: maxScore, exam_date: examDate })
  if (error) throw new Error(extractSupabaseError(error))
}

export async function deleteExam(examId: string): Promise<void> {
  const { error } = await supabase.from('exams').delete().eq('id', examId)
  if (error) throw new Error(extractSupabaseError(error))
}

/** درجات كل طلاب الصف في امتحان معيّن (جدول يعبّيه المدرس) */
export async function fetchExamScores(examId: string): Promise<ExamScoreRow[]> {
  const { data, error } = await supabase.rpc('get_exam_scores', { p_exam_id: examId })
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []).map((r: any) => ({
    studentId: r.student_id,
    name: r.name,
    username: r.username,
    score: r.score !== null ? Number(r.score) : null,
  }))
}

/** يسجّل/يحدّث درجة طالب واحد في امتحان معيّن */
export async function setExamScore(examId: string, studentId: string, score: number): Promise<void> {
  const { error } = await supabase.rpc('set_exam_score', {
    p_exam_id: examId,
    p_student_id: studentId,
    p_score: score,
  })
  if (error) throw new Error(extractSupabaseError(error))
}

/** كل نتائج الطالب الحالي (المسجّل دخوله) في كل امتحانات صفه */
export async function fetchMyExamResults(): Promise<MyExamResult[]> {
  const { data, error } = await supabase.rpc('get_my_exam_results')
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []).map((r: any) => ({
    examId: r.exam_id,
    title: r.title,
    maxScore: Number(r.max_score),
    examDate: r.exam_date,
    score: r.score !== null ? Number(r.score) : null,
  }))
}
