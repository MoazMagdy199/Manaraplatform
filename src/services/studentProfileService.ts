import { supabase, extractSupabaseError } from '@/lib/supabase'

export interface StudentProfileSummary {
  attendance: { presentCount: number; absentCount: number }
  homework: { submitted: number; total: number }
  quiz: { completed: number; total: number }
  examAvg: number | null
  lastLogin: string | null
  lastQuiz: { title: string; submittedAt: string } | null
}

/** ملخص شامل عن طالب معيّن: حضور، واجبات، اختبارات، متوسط امتحانات، آخر نشاط */
export async function fetchStudentProfileSummary(studentId: string): Promise<StudentProfileSummary> {
  const { data, error } = await supabase.rpc('get_student_profile_summary', { p_student_id: studentId })
  if (error) throw new Error(extractSupabaseError(error))

  return {
    attendance: {
      presentCount: data.attendance?.present_count ?? 0,
      absentCount: data.attendance?.absent_count ?? 0,
    },
    homework: {
      submitted: data.homework?.submitted ?? 0,
      total: data.homework?.total ?? 0,
    },
    quiz: {
      completed: data.quiz?.completed ?? 0,
      total: data.quiz?.total ?? 0,
    },
    examAvg: data.exam_avg !== null && data.exam_avg !== undefined ? Number(data.exam_avg) : null,
    lastLogin: data.last_login ?? null,
    lastQuiz: data.last_quiz ? { title: data.last_quiz.title, submittedAt: data.last_quiz.submitted_at } : null,
  }
}
