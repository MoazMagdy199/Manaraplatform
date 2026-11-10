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
    groupId: row.group_id ?? null,
    parentPhone: row.parent_phone ?? null,
    parentName: row.parent_name ?? null,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
  }
}

export async function fetchStudents(search?: string): Promise<User[]> {
  let query = supabase.from('profiles').select('*').eq('role', 'Student').order('created_at', { ascending: false })
  if (search && search.trim()) {
    const s = search.trim()
    query = query.or(`name.ilike.%${s}%,username.ilike.%${s}%,phone.ilike.%${s}%`)
  }
  const { data, error } = await query
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []).map(mapRow)
}

// 👈 شيلنا الإيميل والباسورد
export interface CreateStudentInput {
  name: string
  username: string
  phone: string | null
  grade: string
  groupId?: string | null
  parentPhone?: string | null
  parentName?: string | null
}

export async function createStudent(input: CreateStudentInput): Promise<User> {
  const { data, error } = await supabase.functions.invoke('create-student', { body: input })
  if (error) throw new Error(extractSupabaseError(error, 'تعذّر إضافة الطالب'))
  if (data?.message && !data?.id) throw new Error(data.message)
  return mapRow(data)
}

// 👈 شيلنا الإيميل والباسورد
export interface UpdateStudentInput {
  name: string
  username: string
  phone: string | null
  grade: string
  groupId?: string | null
  parentPhone?: string | null
  parentName?: string | null
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
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) {
    throw new Error(extractSupabaseError(error, 'تعذّر حذف الطالب'))
  }
}

// 👈 شيلنا دالة إعادة تعيين الباسورد لأنها ملهاش لازمة