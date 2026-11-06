import { Link } from 'react-router-dom'
import { Sparkles, Clock, CheckCircle2, HelpCircle, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'

export default function StudentQuizzesPage() {
  const { user } = useAuth()
  const { quizzes, quizResults, lessons, students } = useData() 

  const myResults = quizResults.filter((r) => r.studentId === user?.id)
  const getResult = (quizId: string) => myResults.find((r) => r.quizId === quizId)

  const myQuizzes = quizzes.filter((q) => {
    if (q.lessonId) {
      const lessonExists = lessons.some((l) => l.id === q.lessonId)
      return lessonExists
    }
    if (q.groupId && q.groupId !== user?.groupId) return false;
    if (q.grade && q.grade !== user?.grade) return false;
    return true
  })

  const getLeaderboard = (quizId: string) => {
    return quizResults
      .filter(r => r.quizId === quizId)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(r => ({
        name: students.find(s => s.id === r.studentId)?.name || 'طالب',
        score: r.score,
        maxScore: r.maxScore
      }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">الاختبارات</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          اختبر فهمك بعد كل حصة
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {myQuizzes.map((q) => {
          const result = getResult(q.id)
          const leaders = q.isWeekly ? getLeaderboard(q.id) : []

          return (
            <Card key={q.id} className={q.isWeekly ? 'border-amber-200 shadow-sm' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="h-11 w-11 rounded-xl bg-[var(--color-rose-100)] flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-[var(--color-rose-500)]" />
                  </div>
                  {result && (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> {result.score}/{result.maxScore}
                    </Badge>
                  )}
                </div>
                <h3 className="font-display font-bold mt-4">{q.title}</h3>
                <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                  {q.lessonTitle || 'اختبار شامل'}
                </p>
                <div className="flex items-center gap-4 mt-4 text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5" /> {q.questions.length} أسئلة
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {q.duration} دقيقة
                  </span>
                </div>
                
                <Button asChild className="w-full mt-5" variant={result ? 'outline' : 'default'}>
                  {/* 👈 استخدمنا a href بدل Link عشان نعمل Refresh كامل ونمنع الكاش */}
                  <a href={`/student/quizzes/${q.id}`}>
                    {result ? 'مراجعة الإجابات' : 'ابدأ الاختبار'}
                  </a>
                </Button>

                {q.isWeekly && leaders.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10">
                    <p className="text-xs font-bold text-[var(--color-ink-soft)] mb-3 flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-amber-500" /> لوحة الشرف (أفضل 5 طلاب)
                    </p>
                    <div className="space-y-2">
                      {leaders.map((leader, index) => (
                        <div key={index} className="flex justify-between items-center text-xs bg-black/[0.02] dark:bg-white/5 p-2 rounded-lg">
                          <span className="flex items-center gap-2 font-medium">
                            <span className="w-4 text-center">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </span>
                            {leader.name}
                          </span>
                          <span className="font-bold text-[var(--color-brand-600)]">{leader.score} / {leader.maxScore}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
        {myQuizzes.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="p-14 text-center text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
              <Sparkles className="h-10 w-10 mx-auto opacity-40 mb-3" />
              لا توجد اختبارات متاحة لك حالياً
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}