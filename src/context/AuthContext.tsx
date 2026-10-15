import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import { supabase, extractSupabaseErrorMessage } from '@/lib/supabase'
import { uploadAvatar } from '@/services/filesService'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (username: string, password: string, remember: boolean) => Promise<{ ok: boolean; error?: string; user?: User }>
  logout: () => void
  updateProfile: (name: string, email: string, phone: string) => Promise<{ ok: boolean; error?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>
  updateAvatar: (file: File) => Promise<{ ok: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface ProfileRow {
  id: string
  name: string
  username: string
  email: string
  phone: string
  role: 'Teacher' | 'Student' | 'Assistant'
  grade: string | null
  group_id: string | null
  parent_name: string | null
  parent_phone: string | null
  avatar_url: string | null
  created_at: string
}

function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    phone: row.phone,
    role:
      row.role === 'Teacher'
        ? 'Teacher'
        : row.role === 'Assistant'
          ? 'Assistant'
          : 'Student',
    grade: row.grade ?? undefined,
    groupId: row.group_id ?? null,
    parentName: row.parent_name ?? null,
    parentPhone: row.parent_phone ?? null,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
  }
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error || !data) return null
  return mapProfile(data as ProfileRow)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // دالة تحدّث last_seen_at
    async function updateLastSeen(userId: string) {
      try {
        await supabase
          .from('profiles')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', userId)
      } catch {
        // نتجاهل الأخطاء بصمت
      }
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const userId = data.session.user.id
        const profile = await fetchProfile(userId)
        if (mounted) setUser(profile)
        // نحدّث آخر نشاط في الخلفية
        updateLastSeen(userId)
      }
      if (mounted) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userId = session.user.id
        const profile = await fetchProfile(userId)
        if (mounted) setUser(profile)
        // نحدّث آخر نشاط في الخلفية
        updateLastSeen(userId)
      } else {
        if (mounted) setUser(null)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // نحدّث last_seen_at لما التطبيق يفتح (حتى لو الجلسة موجودة)
  useEffect(() => {
    if (!user) return

    const userId = user.id

    async function updateLastSeen() {
      const { error } = await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) {
        console.error('❌ Failed to update last_seen_at:', error)
      } else {
        console.log('✅ last_seen_at updated for:', userId)
      }
    }

    updateLastSeen()
  }, [user?.id])

  const login: AuthContextValue['login'] = async (username, password, remember) => {
    try {
      // Usernames like "أحمد1" aren't valid emails — resolve to the real
      // (internal, ASCII) login email first.
      const { data: email, error: lookupErr } = await supabase.rpc('get_login_email', {
        p_username: username,
      })
      if (lookupErr || !email) {
        return { ok: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user) {
        return { ok: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
      }

      // "remember me": Supabase persists sessions in localStorage by default.
      // When the user does NOT want to be remembered, we simply note that
      // preference so we can clear the session on tab close if desired.
      if (!remember) {
        sessionStorage.setItem('manara_no_remember', '1')
      } else {
        sessionStorage.removeItem('manara_no_remember')
      }

      const profile = await fetchProfile(data.user.id)
      setUser(profile)
      return { ok: true, user: profile ?? undefined }
    } catch (err) {
      return { ok: false, error: extractSupabaseErrorMessage(err) }
    }
  }

  const logout = () => {
    setUser(null)
    supabase.auth.signOut()
  }

  const updateProfile: AuthContextValue['updateProfile'] = async (name, email, phone) => {
    if (!user) return { ok: false, error: 'يجب تسجيل الدخول' }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ name, email, phone })
        .eq('id', user.id)
        .select()
        .single()
      if (error || !data) return { ok: false, error: extractSupabaseErrorMessage(error) }
      setUser(mapProfile(data as ProfileRow))
      return { ok: true }
    } catch (err) {
      return { ok: false, error: extractSupabaseErrorMessage(err) }
    }
  }

  const updateAvatar: AuthContextValue['updateAvatar'] = async (file) => {
    if (!user) return { ok: false, error: 'يجب تسجيل الدخول' }
    try {
      const url = await uploadAvatar(file)
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id)
        .select()
        .single()
      if (error || !data) return { ok: false, error: extractSupabaseErrorMessage(error) }
      setUser(mapProfile(data as ProfileRow))
      return { ok: true }
    } catch (err) {
      return { ok: false, error: extractSupabaseErrorMessage(err) }
    }
  }

  const changePassword: AuthContextValue['changePassword'] = async (currentPassword, newPassword) => {
    if (!user) return { ok: false, error: 'يجب تسجيل الدخول' }
    try {
      // Re-verify the current password first (Supabase's updateUser does NOT
      // require it by itself, so we confirm identity via a fresh sign-in).
      const { data: email, error: lookupErr } = await supabase.rpc('get_login_email', {
        p_username: user.username,
      })
      if (lookupErr || !email) return { ok: false, error: 'تعذّر التحقق من الحساب' }

      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (verifyErr) return { ok: false, error: 'كلمة المرور الحالية غير صحيحة' }

      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
      if (updateErr) return { ok: false, error: extractSupabaseErrorMessage(updateErr) }

      return { ok: true }
    } catch (err) {
      return { ok: false, error: extractSupabaseErrorMessage(err) }
    }
  }

  const value = useMemo(
    () => ({ user, loading, login, logout, updateProfile, changePassword, updateAvatar }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}