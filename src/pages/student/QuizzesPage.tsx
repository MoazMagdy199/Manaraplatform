import { Link } from 'react-router-dom'
import { Sparkles, Clock, CheckCircle2, HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'

export default function StudentQuizzesPage() {
  const { user } = useAuth()
  const { quizzes, quizResults } = useData()

  const myResults = quizResults.filter((r) => r.studentId === user?.id)
  const getResult = (quizId: string) => myResults.find((r) => r.quizId === quizId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">الاختبارات</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          اختبر فهمك بعد كل حصة
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {quizzes.map((q) => {
          const result = getResult(q.id)
          return (
            <Card key={q.id}>
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
                  {q.lessonTitle}
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
                  <Link to={`/student/quizzes/${q.id}`}>{result ? 'مراجعة الإجابات' : 'ابدأ الاختبار'}</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
