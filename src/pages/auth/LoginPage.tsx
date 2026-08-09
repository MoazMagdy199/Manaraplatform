import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/context/ToastContext'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) {
    return <Navigate to={user.role === 'Teacher' ? '/teacher' : '/student'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await login(username.trim(), password, remember)
    setLoading(false)
    if (!res.ok) {
      setError(res.error || 'حدث خطأ ما')
      return
    }
    toast({ title: 'تم تسجيل الدخول بنجاح', variant: 'success' })
    navigate(res.user?.role === 'Teacher' ? '/teacher' : '/student')
  }

  function fillDemo(role: 'teacher' | 'student') {
    if (role === 'teacher') {
      setUsername('admin')
      setPassword('Admin123@')
    } else {
      setUsername('أحمد1')
      setPassword('Pass1234')
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--color-paper)] dark:bg-[var(--color-dark-bg)]">
      {/* Visual side */}
      <div className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-[var(--color-brand-700)] p-12 text-white">
        <div className="absolute inset-0 pattern-star opacity-[0.12]" />
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-amber-500)]/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-[var(--color-brand-300)]/20 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2.5">
          <svg width="34" height="34" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="#FFFFFF" fillOpacity="0.15" />
            <path d="M32 10 L38 26 L54 32 L38 38 L32 54 L26 38 L10 32 L26 26 Z" fill="var(--color-amber-500)" />
          </svg>
          <span className="font-display text-2xl font-extrabold">منارة</span>
        </Link>

        <div className="relative">
          <h2 className="font-display text-4xl font-extrabold leading-tight max-w-md">
            مساحتك التعليمية نحو التفوق تبدأ من هنا
          </h2>
          <p className="mt-4 text-white/70 max-w-sm leading-relaxed">
            تابع حصصك، سلّم واجباتك، واختبر نفسك — كل ذلك في مكان واحد مصمم لمساعدتك على النجاح.
          </p>
        </div>

        <div className="relative flex items-center gap-6 text-sm text-white/60">
          <span>© {new Date().getFullYear()} منارة التعليمية</span>
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <svg width="30" height="30" viewBox="0 0 64 64">
              <rect width="64" height="64" rx="14" fill="var(--color-brand-500)" />
              <path d="M32 10 L38 26 L54 32 L38 38 L32 54 L26 38 L10 32 L26 26 Z" fill="var(--color-amber-500)" />
            </svg>
            <span className="font-display text-xl font-extrabold">منارة</span>
          </Link>

          <h1 className="font-display text-2xl font-extrabold">تسجيل الدخول</h1>
          <p className="mt-1.5 text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
            أدخل بياناتك للوصول إلى حسابك
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="اسم المستخدم"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm font-medium text-[var(--color-rose-500)] bg-[var(--color-rose-100)] rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--color-brand-500)]"
                />
                تذكرني
              </label>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> تسجيل الدخول
                </>
              )}
            </Button>
          </form>

          <Link
            to="/"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-brand-600)] dark:text-[var(--color-dark-ink-soft)]"
          >
            العودة للصفحة الرئيسية
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
