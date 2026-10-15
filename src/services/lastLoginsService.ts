import { supabase, extractSupabaseError } from '@/lib/supabase'

export interface LastLoginRow {
  id: string
  name: string
  username: string
  grade: string | null
  groupId: string | null
  groupName: string | null
  lastSignInAt: string | null
  lastSeenAt: string | null
}

interface RawRow {
  id: string
  name: string
  username: string
  grade: string | null
  group_id: string | null
  group_name: string | null
  last_sign_in_at: string | null
  last_seen_at: string | null
}

export async function fetchAllStudentsLastLogin(): Promise<LastLoginRow[]> {
  const { data, error } = await supabase.rpc('get_all_students_last_login')
  if (error) throw new Error(extractSupabaseError(error))

  return (data as RawRow[] | null || []).map((r) => ({
    id: r.id,
    name: r.name,
    username: r.username,
    grade: r.grade,
    groupId: r.group_id,
    groupName: r.group_name,
    lastSignInAt: r.last_sign_in_at,
    lastSeenAt: r.last_seen_at,
  }))
}