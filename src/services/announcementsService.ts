import { supabase } from '@/lib/supabase'
import type { Announcement } from '@/types'

interface Row {
  id: string
  title: string
  content: string
  pinned: boolean
  created_at: string
}

function mapRow(r: Row): Announcement {
  return { id: r.id, title: r.title, content: r.content, pinned: r.pinned, createdAt: r.created_at }
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as Row[]).map(mapRow)
}

export interface UpsertAnnouncementInput {
  title: string
  content: string
  pinned: boolean
}

export async function createAnnouncement(input: UpsertAnnouncementInput): Promise<Announcement> {
  const { data, error } = await supabase.from('announcements').insert(input).select().single()
  if (error) throw error
  return mapRow(data as Row)
}

export async function updateAnnouncement(id: string, input: UpsertAnnouncementInput): Promise<Announcement> {
  const { data, error } = await supabase.from('announcements').update(input).eq('id', id).select().single()
  if (error) throw error
  return mapRow(data as Row)
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
}
