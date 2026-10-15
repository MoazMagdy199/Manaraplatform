import { useEffect, useState } from 'react'
import { Users, BookOpen, ClipboardCheck, Megaphone, Phone, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase, extractSupabaseError } from '@/lib/supabase'

interface Stats {
  students: number
  lessons: number
  homework: number
  announcements: number
}

export default function AssistantDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ students: 0, lessons: 0, homework: 0, announcements: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, l, h, a] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'Student'),
          supabase.from('lessons').select('id', { count: 'exact', head: true }),
          supabase.from('homework').select('id', { count: 'exact', head: true }),
          supabase.from('announcements').select('id', { count: 'exact', head: true }),
        ])
        setStats({
          students: s.count ?? 0,
          lessons: l.count ?? 0,
          homework: h.count ?? 0,
          announcements: a.count ?? 0,
        })
      } catch (err) {
        console.error(extractSupabaseError(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cards = [
    { label: 'الطلاب', value: stats.students, icon: Users, color: 'text-[var(--color-brand-500)] bg-[var(--color-brand-50)]', to: '/assistant/students' },
    { label: 'الحصص', value: stats.lessons, icon: BookOpen, color: 'text-indigo-500 bg-indigo-50', to: '/assistant/lessons' },
    { label: 'الواجبات', value: stats.homework, icon: ClipboardCheck, color: 'text-emerald-500 bg-emerald-50', to: '/assistant/homework' },
    { label: 'الإعلانات', value: stats.announcements, icon: Megaphone, color: 'text-amber-500 bg-amber-50', to: '/assistant/announcements' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">
          أهلاً بيك، {user?.name || 'المساعد'} 👋
        </h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          لوحة تحكم المساعد — كل حاجة تحت إيدك
        </p>
      </div>

      {/* كروت الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className={`h-9 w-9 rounded-xl ${c.color} flex items-center justify-center mb-3`}>
                  <c.icon className="h-4.5 w-4.5" />
                </div>
                <p className="font-display text-2xl font-extrabold">
                  {loading ? '...' : c.value}
                </p>
                <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                  {c.label}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* اختصارات سريعة */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-display font-bold text-lg mb-4">اختصارات سريعة</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link to="/assistant/contacts" className="flex items-center gap-3 p-4 rounded-xl bg-black/[0.02] dark:bg-white/5 hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors">
              <Phone className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">جهات الاتصال</span>
            </Link>
            <Link to="/assistant/attendance" className="flex items-center gap-3 p-4 rounded-xl bg-black/[0.02] dark:bg-white/5 hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors">
              <ClipboardCheck className="h-5 w-5 text-amber-600" />
              <span className="font-semibold">تسجيل الحضور</span>
            </Link>
            <Link to="/assistant/grades" className="flex items-center gap-3 p-4 rounded-xl bg-black/[0.02] dark:bg-white/5 hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors">
              <Trophy className="h-5 w-5 text-[var(--color-brand-500)]" />
              <span className="font-semibold">ترتيب الطلاب</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}