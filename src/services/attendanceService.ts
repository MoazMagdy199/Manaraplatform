import { supabase, extractSupabaseError } from '@/lib/supabase'
import type {
  AttendanceRow,
  AttendanceSummaryRow,
  AttendanceStatus,
  ScheduleDay,
  MyAttendanceSummary,
} from '@/types'
/** حضور كل طلاب صف معيّن في تاريخ معيّن (YYYY-MM-DD) */
export async function fetchAttendanceForDate(
  grade: string,
  date: string,
  groupId?: string | null,
): Promise<AttendanceRow[]> {
  const { data, error } = await supabase.rpc('get_attendance_for_date', {
    p_grade: grade,
    p_date: date,
    p_group_id: groupId || null,
  })
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []).map((r: any) => ({
    studentId: r.student_id,
    name: r.name,
    username: r.username,
    status: r.status as AttendanceStatus,
  }))
}

/** يحفظ حضور مجموعة طلاب دفعة واحدة ليوم معيّن */
export async function saveAttendance(
  date: string,
  records: { studentId: string; status: 'present' | 'absent' }[],
): Promise<void> {
  const payload = records.map((r) => ({ student_id: r.studentId, status: r.status }))
  const { error } = await supabase.rpc('save_attendance', { p_date: date, p_records: payload })
  if (error) throw new Error(extractSupabaseError(error))
}

/** ملخص عدد أيام الحضور/الغياب لكل طالب في صف معيّن */
export async function fetchAttendanceSummary(grade: string): Promise<AttendanceSummaryRow[]> {
  const { data, error } = await supabase.rpc('get_attendance_summary', { p_grade: grade })
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []).map((r: any) => ({
    studentId: r.student_id,
    name: r.name,
    grade: r.grade ?? null,
    presentCount: Number(r.present_count),
    absentCount: Number(r.absent_count),
  }))
}
/** ملخص حضور الطالب الحالي فقط */
export async function fetchMyAttendanceSummary(): Promise<MyAttendanceSummary> {
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    throw new Error('يجب تسجيل الدخول أولاً')
  }

  const { data, error } = await supabase.rpc('get_my_attendance_summary')

  if (error) {
    throw new Error(extractSupabaseError(error))
  }

  const row = data?.[0]

  if (!row) {
    return {
      studentId: userData.user.id,
      name: '',
      grade: null,
      presentCount: 0,
      absentCount: 0,
      totalCount: 0,
      attendancePercentage: 0,
      absencePercentage: 0,
    }
  }

  const presentCount = Number(row.present_count) || 0
  const absentCount = Number(row.absent_count) || 0

  const totalCount = presentCount + absentCount

  const attendancePercentage =
    totalCount > 0
      ? Math.round((presentCount / totalCount) * 100)
      : 0

  const absencePercentage =
    totalCount > 0
      ? Math.round((absentCount / totalCount) * 100)
      : 0

  return {
    studentId: row.student_id,
    name: row.name ?? '',
    grade: row.grade ?? null,
    presentCount,
    absentCount,
    totalCount,
    attendancePercentage,
    absencePercentage,
  }
}
// ---------- الجدول الأسبوعي (أي أيام فيها حصص لكل صف) ----------

interface ScheduleRow {
  id: string
  grade: string
  day_of_week: number
  label: string | null
}

function mapSchedule(r: ScheduleRow): ScheduleDay {
  return { id: r.id, grade: r.grade, dayOfWeek: r.day_of_week, label: r.label }
}

export async function fetchSchedule(grade: string): Promise<ScheduleDay[]> {
  const { data, error } = await supabase
    .from('class_schedule')
    .select('*')
    .eq('grade', grade)
    .order('day_of_week', { ascending: true })
  if (error) throw new Error(extractSupabaseError(error))
  return (data as ScheduleRow[]).map(mapSchedule)
}

/** يستبدل أيام الجدول الأسبوعي لصف معيّن بالكامل بالمجموعة الجديدة */
export async function replaceSchedule(grade: string, daysOfWeek: number[]): Promise<void> {
  const { error: delErr } = await supabase.from('class_schedule').delete().eq('grade', grade)
  if (delErr) throw new Error(extractSupabaseError(delErr))

  if (daysOfWeek.length === 0) return

  const { error: insErr } = await supabase
    .from('class_schedule')
    .insert(daysOfWeek.map((d) => ({ grade, day_of_week: d })))
  if (insErr) throw new Error(extractSupabaseError(insErr))
}
