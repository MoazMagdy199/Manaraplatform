import { Link } from 'react-router-dom'
import { Users, BookOpen, ClipboardCheck, Sparkles, Megaphone, ArrowLeft, Pin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { students, lessons, homework, quizzes, announcements, submissions } = useData()

  const stats = [
    { label: 'عدد الطلاب', value: students.length, icon: Users, color: 'var(--color-brand-500)', to: '/teacher/students' },
    { label: 'عدد الحصص', value: lessons.length, icon: BookOpen, color: 'var(--color-indigo-500)', to: '/teacher/lessons' },
    { label: 'عدد الواجبات', value: homework.length, icon: ClipboardCheck, color: 'var(--color-amber-500)', to: '/teacher/homework' },
    { label: 'عدد الاختبارات', value: quizzes.length, icon: Sparkles, color: 'var(--color-rose-500)', to: '/teacher/quizzes' },
    { label: 'عدد الإعلانات', value: announcements.length, icon: Megaphone, color: 'var(--color-brand-700)', to: '/teacher/announcements' },
  ]

  const pending = submissions.filter((s) => s.status === 'pending')

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-extrabold">
  أهلاً بك، {(user?.name?.split(' ').slice(0, 2).join(' ')) || 'أستاذنا'} 👋
</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
          إليك ملخص سريع عن نشاط منصتك اليوم
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to}>
            <Card className="hover:-translate-y-0.5 transition-transform h-full">
              <CardContent className="p-5">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `color-mix(in srgb, ${s.color} 14%, transparent)` }}
                >
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <p className="font-display text-3xl font-extrabold">{s.value}</p>
                <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                  {s.label}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">تسليمات بانتظار التصحيح</h3>
              <Link to="/teacher/homework" className="text-sm text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)] font-semibold flex items-center gap-1">
                عرض الكل <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] py-6 text-center">
                لا توجد تسليمات بانتظار التصحيح حالياً.
              </p>
            ) : (
              <div className="space-y-3">
                {pending.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-black/[0.02] dark:bg-white/5 p-3.5">
                    <div>
                      <p className="font-semibold text-sm">{p.studentName}</p>
                      <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-0.5">
                        {formatDate(p.submittedAt)}
                      </p>
                    </div>
                    <Badge variant="amber">بانتظار التصحيح</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">آخر الإعلانات</h3>
              <Link to="/teacher/announcements" className="text-sm text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)] font-semibold flex items-center gap-1">
                عرض الكل <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-xl bg-black/[0.02] dark:bg-white/5 p-3.5">
                  {a.pinned && <Pin className="h-4 w-4 text-[var(--color-amber-500)] shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-semibold text-sm">{a.title}</p>
                    <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-0.5 line-clamp-1">
                      {a.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
