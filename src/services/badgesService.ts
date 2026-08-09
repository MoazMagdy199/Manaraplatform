import { supabase, extractSupabaseError } from '@/lib/supabase'
import type { Badge } from '@/types'

async function fetchBadgesFor(studentId: string): Promise<Badge[]> {
  const { data: allBadges, error: badgesErr } = await supabase.from('badges').select('*')
  if (badgesErr) throw new Error(extractSupabaseError(badgesErr))

  const { data: earned, error: earnedErr } = await supabase
    .from('student_badges')
    .select('badge_id, earned_at')
    .eq('student_id', studentId)
  if (earnedErr) throw new Error(extractSupabaseError(earnedErr))

  const earnedMap = new Map((earned || []).map((e: any) => [e.badge_id, e.earned_at]))

  return (allBadges || []).map((b: any) => ({
    id: b.id,
    icon: b.icon,
    title: b.title,
    description: b.description,
    earned: earnedMap.has(b.id),
    earnedAt: earnedMap.get(b.id),
  }))
}

export async function fetchMyBadges(): Promise<Badge[]> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []
  return fetchBadgesFor(userData.user.id)
}

export async function fetchStudentBadges(studentId: string): Promise<Badge[]> {
  return fetchBadgesFor(studentId)
}
