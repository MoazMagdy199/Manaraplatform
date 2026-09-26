import { supabase, extractSupabaseError } from '@/lib/supabase'

export interface Group {
  id: string
  name: string
  grade: string | null
  createdAt: string
}

function mapGroup(row: any): Group {
  return { id: row.id, name: row.name, grade: row.grade, createdAt: row.created_at }
}

export async function fetchGroups(): Promise<Group[]> {
  const { data, error } = await supabase.from('groups').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []).map(mapGroup)
}

export async function createGroup(name: string, grade?: string): Promise<Group> {
  const { data, error } = await supabase.from('groups').insert({ name, grade: grade || null }).select().single()
  if (error) throw new Error(extractSupabaseError(error))
  return mapGroup(data)
}

export async function updateGroup(id: string, name: string, grade?: string): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .update({ name, grade: grade || null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(extractSupabaseError(error))
  return mapGroup(data)
}

/** حذف مجموعة: الطلاب والحصص المرتبطين بيها بيرجعوا تلقائياً لمنطق "الصف" القديم (مش بيتحذفوا) */
export async function deleteGroup(id: string): Promise<void> {
  const { error } = await supabase.from('groups').delete().eq('id', id)
  if (error) throw new Error(extractSupabaseError(error))
}
