import { BookMarked, Sparkles, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'

export default function StudentGradesPage() {
  const { user } = useAuth()
  const { grades, submissions, quizResults, homework, quizzes } = useData()

  const myGrade = grades.find((g) => g.studentId === user?.id)
  const myHomeworkSubs = submissions.filter((s) => s.studentId === user?.id)
  const myQuizResults = quizResults.filter((r) => r.studentId === user?.id)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">درجاتي</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          تابع أداءك في الواجبات والاختبارات
        </p>
      </div>

      {myGrade && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 text-center">
              <BookMarked className="h-6 w-6 text-[var(--color-brand-500)] mx-auto mb-2" />
              <p className="font-display text-2xl font-extrabold">{myGrade.homeworkAvg}%</p>
              <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                معدل الواجبات
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Sparkles className="h-6 w-6 text-[var(--color-amber-600)] mx-auto mb-2" />
              <p className="font-display text-2xl font-extrabold">{myGrade.quizAvg}%</p>
              <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                معدل الاختبارات
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Trophy className="h-6 w-6 text-[var(--color-rose-500)] mx-auto mb-2" />
              <p className="font-display text-2xl font-extrabold">{myGrade.overall}%</p>
              <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                المعدل العام
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display font-bold text-lg mb-4">درجات الواجبات</h3>
          <div className="space-y-2.5">
            {myHomeworkSubs.length === 0 && (
              <p className="text-sm text-[var(--color-ink-soft)] py-4 text-center">لا توجد واجبات مسلَّمة بعد</p>
            )}
            {myHomeworkSubs.map((s) => {
              const hw = homework.find((h) => h.id === s.homeworkId)
              return (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-black/[0.02] dark:bg-white/5 p-3.5">
                  <span className="text-sm font-semibold">{hw?.title}</span>
                  <span className="text-sm font-bold">
                    {s.grade !== null ? `${s.grade}/${s.maxGrade}` : 'قيد التصحيح'}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display font-bold text-lg mb-4">درجات الاختبارات</h3>
          <div className="space-y-2.5">
            {myQuizResults.length === 0 && (
              <p className="text-sm text-[var(--color-ink-soft)] py-4 text-center">لم تخض أي اختبار بعد</p>
            )}
            {myQuizResults.map((r) => {
              const quiz = quizzes.find((q) => q.id === r.quizId)
              return (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-black/[0.02] dark:bg-white/5 p-3.5">
                  <span className="text-sm font-semibold">{quiz?.title}</span>
                  <span className="text-sm font-bold">
                    {r.score}/{r.maxScore}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
