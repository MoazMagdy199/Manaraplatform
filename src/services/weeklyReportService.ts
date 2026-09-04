import { supabase, extractSupabaseError } from '@/lib/supabase'

export interface WeeklyHomeworkReport {
  homeworkId: string
  title: string
  deadline: string
  createdAt: string
  totalStudents: number
  submittedCount: number
  missingStudents: { id: string; name: string }[]
}

export interface WeeklyAttendanceReport {
  presentCount: number
  absentCount: number
  daysMarked: number
}

export interface StudentNeedingAttention {
  id: string
  name: string
  missedHomeworkCount: number
  absentCount: number
}

export interface WeeklyReport {
  totalStudents: number
  homeworks: WeeklyHomeworkReport[]
  attendance: WeeklyAttendanceReport
  needsAttention: StudentNeedingAttention[]
}

/** ملخص أسبوعي (أو أي فترة) لصف معيّن: واجبات + حضور + طلاب محتاجين متابعة */
export async function fetchWeeklyReport(grade: string, since: string): Promise<WeeklyReport> {
  const { data, error } = await supabase.rpc('get_weekly_report', { p_grade: grade, p_since: since })
  if (error) throw new Error(extractSupabaseError(error))

  return {
    totalStudents: data.total_students,
    homeworks: (data.homeworks || []).map((h: any) => ({
      homeworkId: h.homework_id,
      title: h.title,
      deadline: h.deadline,
      createdAt: h.created_at,
      totalStudents: h.total_students,
      submittedCount: h.submitted_count,
      missingStudents: h.missing_students || [],
    })),
    attendance: {
      presentCount: data.attendance?.present_count ?? 0,
      absentCount: data.attendance?.absent_count ?? 0,
      daysMarked: data.attendance?.days_marked ?? 0,
    },
    needsAttention: (data.needs_attention || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      missedHomeworkCount: s.missed_homework_count,
      absentCount: s.absent_count,
    })),
  }
}
