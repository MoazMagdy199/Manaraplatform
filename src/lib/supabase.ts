import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — check your .env file.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

/** Turns a Supabase/Postgres error into a friendly Arabic message. */
export function extractSupabaseErrorMessage(error: unknown, fallback = 'حدث خطأ ما، يرجى المحاولة مرة أخرى'): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message: unknown }).message)
    if (msg.includes('Invalid login credentials')) return 'اسم المستخدم أو كلمة المرور غير صحيحة'
    if (msg.includes('duplicate key')) return 'هذا العنصر موجود بالفعل'
    return msg
  }
  return fallback
}

// Alias — several service files were written using this shorter name.
export const extractSupabaseError = extractSupabaseErrorMessage
