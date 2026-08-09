import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { fetchMyBadges } from '@/services/badgesService'
import { extractSupabaseErrorMessage } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import type { Badge } from '@/types'

export default function AchievementsPage() {
  const { lessons } = useData()
  const { toast } = useToast()
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyBadges()
      .then(setBadges)
      .catch((err) => toast({ title: extractSupabaseErrorMessage(err, 'تعذّر تحميل الإنجازات'), variant: 'error' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const completedLessons = lessons.filter((l) => l.completedByStudent).length
  const progressPct = lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0
  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">الإنجازات</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          حصلت على {earnedCount} من {badges.length} أوسمة
        </p>
      </div>

      <Card className="bg-gradient-to-l from-[var(--color-brand-600)] to-[var(--color-brand-500)] border-0 text-white">
        <CardContent className="p-6">
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span>تقدمك داخل الكورس</span>
            <span>{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="bg-white/20" indicatorClassName="bg-[var(--color-amber-300)]" />
          <p className="text-white/70 text-sm mt-3">
            أكملت {completedLessons} من {lessons.length} حصص دراسية
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {badges.map((b) => (
            <Card
              key={b.id}
              className={cn('text-center transition-opacity', !b.earned && 'opacity-50 grayscale')}
            >
              <CardContent className="p-6">
                <div
                  className={cn(
                    'h-16 w-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4',
                    b.earned ? 'bg-[var(--color-amber-100)]' : 'bg-black/5 dark:bg-white/10',
                  )}
                >
                  {b.icon}
                </div>
                <p className="font-display font-bold">{b.title}</p>
                <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1.5 leading-relaxed">
                  {b.description}
                </p>
                {b.earned && b.earnedAt && (
                  <p className="text-[10px] text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)] font-semibold mt-3">
                    حصلت عليه في {formatDate(b.earnedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
