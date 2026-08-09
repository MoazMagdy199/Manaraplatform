import { supabase } from '@/lib/supabase'

interface UploadResponse {
  url: string
  fileName: string
}

const BUCKET = 'homework-files'
const ALLOWED_EXT = ['pdf', 'png', 'jpg', 'jpeg', 'webp']
const MAX_SIZE_BYTES = 15 * 1024 * 1024 // 15 MB

/**
 * Uploads a file (PDF/image) to Supabase Storage and returns a permanent,
 * publicly accessible URL. Used for homework submission attachments.
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXT.includes(ext)) {
    throw new Error('نوع الملف غير مدعوم. الأنواع المسموحة: PDF، PNG، JPG')
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('حجم الملف يتجاوز الحد المسموح به (15 ميجابايت)')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('يجب تسجيل الدخول لرفع الملفات')

  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, fileName: file.name }
}

/** Uploads several files in parallel and returns their public URLs, in order. */
export async function uploadFiles(files: File[]): Promise<string[]> {
  const results = await Promise.all(files.map((f) => uploadFile(f)))
  return results.map((r) => r.url)
}

const AVATAR_BUCKET = 'avatars'
const AVATAR_ALLOWED_EXT = ['png', 'jpg', 'jpeg', 'webp']
const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Uploads/replaces the current user's profile picture. Always stored at a
 * fixed path per user (avatars/{user_id}/avatar.ext) so re-uploading simply
 * overwrites the old picture instead of accumulating orphaned files.
 */
export async function uploadAvatar(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!AVATAR_ALLOWED_EXT.includes(ext)) {
    throw new Error('نوع الصورة غير مدعوم. الأنواع المسموحة: PNG، JPG، WEBP')
  }
  if (file.size > AVATAR_MAX_SIZE_BYTES) {
    throw new Error('حجم الصورة يتجاوز الحد المسموح به (5 ميجابايت)')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('يجب تسجيل الدخول لرفع صورة شخصية')

  const path = `${user.id}/avatar.${ext}`

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true, // overwrite any previous avatar for this user
  })
  if (error) throw error

  // Cache-bust the public URL so the new picture shows immediately
  // (browsers/CDNs would otherwise keep serving the cached old image
  // since the file path/name never changes on re-upload).
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}
