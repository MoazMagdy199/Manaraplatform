import { useEffect, useState } from 'react'
import { Award, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/context/ToastContext'
import { formatDate } from '@/lib/utils'
import { fetchMyExamResults, type MyExamResult } from '@/services/examsService'

export default function StudentGradesPage() {
  const { toast } = useToast()
  const [results, setResults] = useState<MyExamResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyExamResults()
      .then(setResults)
      .catch((err) => toast({ title: err instanceof Error ? err.message : 'تعذّر تحميل الدرجات', variant: 'error' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scoredResults = results.filter((r) => r.score !== null)
  const overallPct =
    scoredResults.length > 0
      ? Math.round(
          (scoredResults.reduce((sum, r) => sum + (r.score! / r.maxScore) * 100, 0) / scoredResults.length),
        )
      : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">درجاتي</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          نتائجك في كل الامتحانات
        </p>
      </div>

      {overallPct !== null && (
        <Card className="bg-gradient-to-l from-[var(--color-brand-600)] to-[var(--color-brand-500)] border-0 text-white">
          <CardContent className="p-6 flex items-center gap-4">
            <TrendingUp className="h-9 w-9 text-[var(--color-amber-300)]" />
            <div>
              <p className="font-display text-2xl font-extrabold">{overallPct}%</p>
              <p className="text-white/80 text-sm mt-0.5">متوسط نسبتك في {scoredResults.length} امتحان</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="p-14 text-center text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
            <Award className="h-10 w-10 mx-auto opacity-40 mb-3" />
            لا توجد امتحانات مسجّلة بعد
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {results.map((r) => {
            const pct = r.score !== null ? Math.round((r.score / r.maxScore) * 100) : null
            const missing = r.score !== null ? r.maxScore - r.score : null
            return (
              <Card key={r.examId}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-bold">{r.title}</h3>
                      <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                        {formatDate(r.examDate)}
                      </p>
                    </div>
                    {r.score === null ? (
                      <Badge variant="amber">لسه ما اتصححش</Badge>
                    ) : (
                      <Badge variant={pct! >= 50 ? 'success' : 'rose'}>
                        {r.score} / {r.maxScore}
                      </Badge>
                    )}
                  </div>

                  {r.score !== null && (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="rounded-xl bg-black/[0.02] dark:bg-white/5 p-3 text-center">
                        <p className="font-display text-xl font-extrabold text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]">
                          {pct}%
                        </p>
                        <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-0.5">
                          النسبة
                        </p>
                      </div>
                      <div className="rounded-xl bg-black/[0.02] dark:bg-white/5 p-3 text-center">
                        <p className="font-display text-xl font-extrabold">
                          {missing! > 0 ? missing : '—'}
                        </p>
                        <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-0.5">
                          الدرجة الناقصة
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
