import { supabase, extractSupabaseError } from '@/lib/supabase'
import type { User } from '@/types'

export interface ActivityLogRow {
  id: string
  userId: string
  userName: string
  actionType: 'create' | 'update' | 'delete'
  entityType: string
  entityId: string | null
  description: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

interface RawRow {
  id: string
  user_id: string
  user_name: string
  action_type: string
  entity_type: string
  entity_id: string | null
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
}

function mapRow(r: RawRow): ActivityLogRow {
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    actionType: r.action_type as 'create' | 'update' | 'delete',
    entityType: r.entity_type,
    entityId: r.entity_id,
    description: r.description,
    metadata: r.metadata,
    createdAt: r.created_at,
  }
}

/**
 * يسجّل نشاط في السجل.
 * لو فشل، مش بيرمي Error (عشان ميوقفش العملية الأساسية).
 */
export async function logActivity(params: {
  user: User
  actionType: 'create' | 'update' | 'delete'
  entityType: string
  entityId?: string | null
  description: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    await supabase.from('activity_log').insert({
      user_id: params.user.id,
      user_name: params.user.name,
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      description: params.description,
      metadata: params.metadata || null,
    })
  } catch (err) {
    console.warn('Failed to log activity:', err)
  }
}

/** يجيب كل الأنشطة (للمدرس) */
export async function fetchActivityLog(limit = 100): Promise<ActivityLogRow[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(extractSupabaseError(error))
  return (data as RawRow[] | null || []).map(mapRow)
}

/** يجيب أنشطة Assistant معين */
export async function fetchUserActivity(userId: string, limit = 50): Promise<ActivityLogRow[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(extractSupabaseError(error))
  return (data as RawRow[] | null || []).map(mapRow)
}