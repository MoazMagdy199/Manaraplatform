import { supabase } from '@/lib/supabase'
import type { Lesson } from '@/types'

interface LessonRow {
  id: string
  title: string
  description: string
  content: string
  pdf_url: string | null
  video_url: string | null
  image_url: string | null
  created_at: string
  lesson_attachments: { id: string; name: string; url: string }[]
}

function mapLesson(r: LessonRow, completed?: boolean): Lesson {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    content: r.content,
    pdfUrl: r.pdf_url ?? undefined,
    videoUrl: r.video_url ?? undefined,
    imageUrl: r.image_url ?? undefined,
    attachments: (r.lesson_attachments || []).map((a) => ({ id: a.id, name: a.name, url: a.url })),
    createdAt: r.created_at,
    completedByStudent: completed,
  }
}

export async function fetchLessons(currentUserId?: string, isStudent?: boolean): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*, lesson_attachments(*)')
    .order('created_at', { ascending: false })
  if (error) throw error

  let completedIds = new Set<string>()
  if (isStudent && currentUserId) {
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('student_id', currentUserId)
    completedIds = new Set((progress || []).map((p) => p.lesson_id))
  }

  return (data as LessonRow[]).map((r) => mapLesson(r, isStudent ? completedIds.has(r.id) : undefined))
}

export interface UpsertLessonInput {
  title: string
  description: string
  content: string
  pdfUrl?: string
  videoUrl?: string
  imageUrl?: string
}

function toRow(input: UpsertLessonInput) {
  return {
    title: input.title,
    description: input.description,
    content: input.content,
    pdf_url: input.pdfUrl || null,
    video_url: input.videoUrl || null,
    image_url: input.imageUrl || null,
  }
}

export async function createLesson(input: UpsertLessonInput): Promise<Lesson> {
  const { data, error } = await supabase
    .from('lessons')
    .insert(toRow(input))
    .select('*, lesson_attachments(*)')
    .single()
  if (error) throw error
  return mapLesson(data as LessonRow)
}

export async function updateLesson(id: string, input: UpsertLessonInput): Promise<Lesson> {
  const { data, error } = await supabase
    .from('lessons')
    .update(toRow(input))
    .eq('id', id)
    .select('*, lesson_attachments(*)')
    .single()
  if (error) throw error
  return mapLesson(data as LessonRow)
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase.from('lessons').delete().eq('id', id)
  if (error) throw error
}

export async function markLessonRead(id: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('يجب تسجيل الدخول')

  const { error } = await supabase
    .from('lesson_progress')
    .insert({ lesson_id: id, student_id: user.id })
  // Ignore "already marked as read" conflicts (unique constraint violation)
  if (error && !error.message.includes('duplicate key')) throw error

  // Evaluate badges (e.g. "أكملت 5 حصص") after every successful completion
  await supabase.rpc('award_badges_for_student')
}
