import { supabase, extractSupabaseError } from '@/lib/supabase'
import type { StudentGrade } from '@/types'

function mapRow(row: any): StudentGrade {
  return {
    studentId: row.student_id,
    studentName: row.profile?.name || '',
    grade: row.profile?.grade ?? null,
    homeworkAvg: Number(row.homework_avg),
    quizAvg: Number(row.quiz_avg),
    overall: Number(row.overall),
  }
}

export async function fetchAllGrades(): Promise<StudentGrade[]> {
  const { data, error } = await supabase.from('student_grades').select('*, profile:profiles(name, grade)')
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []).map(mapRow)
}

export async function fetchMyGrade(): Promise<StudentGrade> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('يجب تسجيل الدخول أولاً')

  const { data, error } = await supabase
    .from('student_grades')
    .select('*, profile:profiles(name, grade)')
    .eq('student_id', userData.user.id)
    .maybeSingle()
  if (error) throw new Error(extractSupabaseError(error))
  if (!data) {
    return { studentId: userData.user.id, studentName: '', grade: null, homeworkAvg: 0, quizAvg: 0, overall: 0 }
  }
  return mapRow(data)
}

export async function updateStudentGrade(studentId: string, homeworkAvg: number, quizAvg: number): Promise<StudentGrade> {
  const { data, error } = await supabase.rpc('update_student_grade', {
    p_student_id: studentId,
    p_homework_avg: homeworkAvg,
    p_quiz_avg: quizAvg,
  })
  if (error) throw new Error(extractSupabaseError(error))

  const { data: profile } = await supabase.from('profiles').select('name, grade').eq('id', studentId).single()
  return {
    studentId: data.student_id,
    studentName: profile?.name || '',
    grade: profile?.grade ?? null,
    homeworkAvg: Number(data.homework_avg),
    quizAvg: Number(data.quiz_avg),
    overall: Number(data.overall),
  }
}
