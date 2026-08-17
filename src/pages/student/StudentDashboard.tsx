import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ClipboardCheck, Megaphone, ArrowLeft, Award, CalendarCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/context/AuthContext'
import { useData } from '@/context/DataContext'
import { timeAgo, formatDate } from '@/lib/utils'
import { fetchMyAttendanceSummary } from '@/services/attendanceService'

export default function StudentDashboard() {
  const { user } = useAuth()
  const { lessons, homework, announcements, grades, quizResults } = useData()
  const [attendance, setAttendance] = useState<Awaited<ReturnType<typeof fetchMyAttendanceSummary>> | null>(null)
  useEffect(() => {
  fetchMyAttendanceSummary()
    .then(setAttendance)
    .catch(() => setAttendance(null))
}, [])

  const latestLesson = lessons[lessons.length - 1]
  const latestHomework = homework[0]
  const latestAnnouncement = announcements[0]
  const myGrade = grades.find((g) => g.studentId === user?.id)

  const completedLessons = lessons.filter((l) => l.completedByStudent).length
  const progressPct = lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-l from-[var(--color-brand-600)] to-[var(--color-brand-500)] p-7 text-white relative overflow-hidden">
        <div className="absolute inset-0 pattern-star opacity-[0.1]" />
        <div className="relative">
          <h2 className="font-display text-2xl font-extrabold">أهلاً بك، {user?.name.split(' ')[0]} 👋</h2>
          <p className="text-white/80 mt-1.5 max-w-md">استمر في التقدم، أنت على بُعد خطوات من إنهاء الكورس بنجاح!</p>
          <div className="mt-5 max-w-sm">
            <div className="flex justify-between text-sm font-semibold mb-1.5">
              <span>نسبة إنهاء الكورس</span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="bg-white/20" indicatorClassName="bg-[var(--color-amber-400,#F0C670)]" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/40 flex items-center justify-center">
                <BookOpen className="h-4.5 w-4.5 text-[var(--color-brand-500)]" />
              </div>
              <span className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                آخر حصة
              </span>
            </div>
            <p className="font-semibold text-sm line-clamp-2">{latestLesson?.title}</p>
            <Link to="/student/lessons" className="text-xs text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)] font-semibold flex items-center gap-1 mt-3">
              عرض الحصص <ArrowLeft className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-[var(--color-amber-100)] flex items-center justify-center">
                <ClipboardCheck className="h-4.5 w-4.5 text-[var(--color-amber-600)]" />
              </div>
              <span className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                آخر واجب
              </span>
            </div>
            <p className="font-semibold text-sm line-clamp-2">{latestHomework?.title}</p>
            <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
              يُسلَّم قبل {formatDate(latestHomework?.deadline || new Date())}
            </p>
            <Link to="/student/homework" className="text-xs text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)] font-semibold flex items-center gap-1 mt-3">
              عرض الواجبات <ArrowLeft className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-[var(--color-indigo-300)]/25 flex items-center justify-center">
                <Megaphone className="h-4.5 w-4.5 text-[var(--color-indigo-500)]" />
              </div>
              <span className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                {latestAnnouncement && timeAgo(latestAnnouncement.createdAt)}
              </span>
            </div>
            <p className="font-semibold text-sm line-clamp-2">{latestAnnouncement?.title}</p>
            <Link to="/student/announcements" className="text-xs text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)] font-semibold flex items-center gap-1 mt-3">
              كل الإعلانات <ArrowLeft className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-display font-bold text-lg mb-4">درجاتي</h3>
            {myGrade ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-black/[0.02] dark:bg-white/5 p-4">
                  <p className="font-display text-2xl font-extrabold text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]">
                    {myGrade.homeworkAvg}%
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                    الواجبات
                  </p>
                </div>
                <div className="rounded-xl bg-black/[0.02] dark:bg-white/5 p-4">
                  <p className="font-display text-2xl font-extrabold text-[var(--color-amber-600)]">
                    {myGrade.quizAvg}%
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                    الاختبارات
                  </p>
                </div>
                <div className="rounded-xl bg-black/[0.02] dark:bg-white/5 p-4">
                  <p className="font-display text-2xl font-extrabold">{myGrade.overall}%</p>
                  <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                    المعدل العام
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-ink-soft)]">لا توجد درجات مسجلة بعد</p>
            )}
            <Link to="/student/grades" className="text-sm text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)] font-semibold flex items-center gap-1 mt-4">
              تفاصيل الدرجات <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
<Card>
  <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-display font-bold text-lg">الحضور والغياب</h3>
      <CalendarCheck className="h-5 w-5 text-[var(--color-brand-500)]" />
    </div>

    {attendance ? (
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-black/[0.02] dark:bg-white/5 p-4">
          <p className="font-display text-2xl font-extrabold text-[var(--color-brand-600)]">
            {attendance.attendancePercentage}%
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] mt-1">
            نسبة الحضور
          </p>
        </div>

        <div className="rounded-xl bg-black/[0.02] dark:bg-white/5 p-4">
          <p className="font-display text-2xl font-extrabold text-[var(--color-amber-600)]">
           {attendance.absentCount}
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] mt-1">
            أيام الغياب
          </p>
        </div>

        <div className="rounded-xl bg-black/[0.02] dark:bg-white/5 p-4">
          <p className="font-display text-2xl font-extrabold">
            {attendance.totalCount}
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] mt-1">
            إجمالي الحصص
          </p>
        </div>
      </div>
    ) : (
      <p className="text-sm text-[var(--color-ink-soft)]">
        لا توجد بيانات حضور مسجلة بعد
      </p>
    )}
  </CardContent>
</Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">آخر نتائج الاختبارات</h3>
              <Award className="h-5 w-5 text-[var(--color-amber-500)]" />
            </div>
            <div className="space-y-3">
              {quizResults.filter((r) => r.studentId === user?.id).slice(-3).reverse().map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-black/[0.02] dark:bg-white/5 p-3.5">
                  <span className="text-sm font-semibold">اختبار #{r.quizId.split('-')[1]}</span>
                  <span className="text-sm font-bold text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]">
                    {r.score}/{r.maxScore}
                  </span>
                </div>
              ))}
              {quizResults.filter((r) => r.studentId === user?.id).length === 0 && (
                <p className="text-sm text-[var(--color-ink-soft)] py-4 text-center">لم تخض أي اختبار بعد</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
