import { supabase, extractSupabaseError } from '@/lib/supabase'
import type { User } from '@/types'

function mapRow(row: any): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    phone: row.phone,
    role: row.role,
    grade: row.grade ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
  }
}

export async function fetchStudents(search?: string): Promise<User[]> {
  let query = supabase.from('profiles').select('*').eq('role', 'Student').order('created_at', { ascending: false })
  if (search && search.trim()) {
    const s = search.trim()
    query = query.or(`name.ilike.%${s}%,username.ilike.%${s}%,email.ilike.%${s}%`)
  }
  const { data, error } = await query
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []).map(mapRow)
}

export interface CreateStudentInput {
  name: string
  username: string
  password: string
  email: string
  phone: string
  grade: string
}

export async function createStudent(input: CreateStudentInput): Promise<User> {
  const { data, error } = await supabase.functions.invoke('create-student', { body: input })
  if (error) throw new Error(extractSupabaseError(error, 'تعذّر إضافة الطالب'))
  if (data?.message && !data?.id) throw new Error(data.message)
  return mapRow(data)
}

export interface UpdateStudentInput {
  name: string
  username: string
  email: string
  phone: string
  grade: string
  newPassword?: string
}

export async function updateStudent(id: string, input: UpdateStudentInput): Promise<User> {
  const { data, error } = await supabase.functions.invoke('update-student', {
    body: { studentId: id, ...input },
  })
  if (error) throw new Error(extractSupabaseError(error, 'تعذّر تحديث بيانات الطالب'))
  if (data?.message && !data?.id) throw new Error(data.message)
  return mapRow(data)
}

export async function deleteStudent(id: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-student', { body: { studentId: id } })
  if (error) throw new Error(extractSupabaseError(error, 'تعذّر حذف الطالب'))
  if (data?.message && !data?.success) throw new Error(data.message)
}

export async function resetStudentPassword(id: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('reset-student-password', { body: { studentId: id } })
  if (error) throw new Error(extractSupabaseError(error, 'تعذّر إعادة تعيين كلمة المرور'))
  if (!data?.newPassword) throw new Error(data?.message || 'تعذّر إعادة تعيين كلمة المرور')
  return data.newPassword
}
