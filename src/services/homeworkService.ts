import { supabase, extractSupabaseError } from '@/lib/supabase'
import type { Homework, HomeworkSubmission, MissingStudent } from '@/types'

function mapHomeworkRow(row: any): Homework {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    lessonTitle: row.lesson?.title || '',
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    deadline: row.deadline,
    maxGrade: row.max_grade,
    createdAt: row.created_at,
  }
}

function mapSubmissionRow(row: any): HomeworkSubmission {
  return {
    id: row.id,
    homeworkId: row.homework_id,
    homeworkTitle: row.homework?.title || '',
    studentId: row.student_id,
    studentName: row.student?.name || '',
    answer: row.answer,
    fileUrls: row.file_urls ?? [],
    grade: row.grade,
    maxGrade: row.homework?.max_grade ?? 10,
    feedback: row.feedback,
    status: row.status,
    submittedAt: row.submitted_at,
  }
}

export async function fetchHomework(): Promise<Homework[]> {
  const { data, error } = await supabase
    .from('homework')
    .select('*, lesson:lessons(title)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []).map(mapHomeworkRow)
}

export interface UpsertHomeworkInput {
  lessonId: string
  title: string
  description: string
  imageUrl?: string | null
  deadline: string
  maxGrade: number
}

function toColumns(input: UpsertHomeworkInput) {
  return {
    lesson_id: input.lessonId,
    title: input.title,
    description: input.description,
    image_url: input.imageUrl || null,
    deadline: input.deadline,
    max_grade: input.maxGrade,
  }
}

export async function createHomework(input: UpsertHomeworkInput): Promise<Homework> {
  const { data, error } = await supabase.from('homework').insert(toColumns(input)).select('*, lesson:lessons(title)').single()
  if (error) throw new Error(extractSupabaseError(error))
  return mapHomeworkRow(data)
}

export async function updateHomework(id: string, input: UpsertHomeworkInput): Promise<Homework> {
  const { data, error } = await supabase
    .from('homework')
    .update(toColumns(input))
    .eq('id', id)
    .select('*, lesson:lessons(title)')
    .single()
  if (error) throw new Error(extractSupabaseError(error))
  return mapHomeworkRow(data)
}

export async function deleteHomework(id: string): Promise<void> {
  const { error } = await supabase.from('homework').delete().eq('id', id)
  if (error) throw new Error(extractSupabaseError(error))
}

export async function fetchSubmissions(homeworkId?: string): Promise<HomeworkSubmission[]> {
  let query = supabase
    .from('homework_submissions')
    .select('*, homework:homework(title, max_grade), student:profiles(name)')
    .order('submitted_at', { ascending: false })
  if (homeworkId) query = query.eq('homework_id', homeworkId)
  const { data, error } = await query
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []).map(mapSubmissionRow)
}

export async function submitHomework(input: { homeworkId: string; answer: string; fileUrls?: string[] }): Promise<HomeworkSubmission> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('يجب تسجيل الدخول أولاً')

  // Get the homework deadline
  const { data: hw, error: homeworkError } = await supabase
    .from('homework')
    .select('deadline')
    .eq('id', input.homeworkId)
    .single()

  if (homeworkError) {
    throw new Error(extractSupabaseError(homeworkError))
  }

  // Do not allow submission after the deadline
  if (new Date(hw.deadline) < new Date()) {
    throw new Error('انتهى موعد تسليم هذا الواجب')
  }

  const { data, error } = await supabase
    .from('homework_submissions')
    .insert({
      homework_id: input.homeworkId,
      student_id: userData.user.id,
      answer: input.answer,
      file_urls: input.fileUrls && input.fileUrls.length > 0 ? input.fileUrls : [],
      status: 'pending',
    })
    .select('*, homework:homework(title, max_grade), student:profiles(name)')
    .single()

  if (error) {
    throw new Error(
      extractSupabaseError(error, 'لقد قمت بتسليم هذا الواجب مسبقاً')
    )
  }

  await supabase.rpc('award_badges_for_student')

  return mapSubmissionRow(data)
}

export async function gradeSubmission(submissionId: string, grade: number, feedback: string): Promise<HomeworkSubmission> {
  const { data, error } = await supabase
    .from('homework_submissions')
    .update({ grade, feedback, status: 'graded' })
    .eq('id', submissionId)
    .select('*, homework:homework(title, max_grade), student:profiles(name)')
    .single()
  if (error) throw new Error(extractSupabaseError(error))
  return mapSubmissionRow(data)
}

/** الطلاب اللي لسه ما سلّموش الواجب ده (مقصورة على نفس صف الحصة تلقائياً) */
export async function getMissingSubmissions(homeworkId: string): Promise<MissingStudent[]> {
  const { data, error } = await supabase.rpc('get_missing_submissions', { p_homework_id: homeworkId })
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []) as MissingStudent[]
}
