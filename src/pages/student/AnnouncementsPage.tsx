import { Pin, Megaphone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useData } from '@/context/DataContext'
import { formatDateTime } from '@/lib/utils'

export default function StudentAnnouncementsPage() {
  const { announcements } = useData()
  const sorted = [...announcements].sort((a, b) => Number(b.pinned) - Number(a.pinned))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">الإعلانات</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          آخر مستجدات المدرس والكورس
        </p>
      </div>

      <div className="space-y-4">
        {sorted.map((a) => (
          <Card key={a.id} className={a.pinned ? 'border-[var(--color-amber-500)]/40' : ''}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-indigo-300)]/25 flex items-center justify-center shrink-0">
                <Megaphone className="h-5 w-5 text-[var(--color-indigo-500)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-display font-bold">{a.title}</p>
                  {a.pinned && <Pin className="h-3.5 w-3.5 text-[var(--color-amber-500)]" />}
                </div>
                <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1.5 leading-relaxed">
                  {a.content}
                </p>
                <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-2.5">
                  {formatDateTime(a.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {sorted.length === 0 && (
          <p className="text-center text-[var(--color-ink-soft)] py-10">لا توجد إعلانات حالياً</p>
        )}
      </div>
    </div>
  )
}
