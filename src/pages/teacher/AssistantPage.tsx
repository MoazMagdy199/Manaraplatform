import { useEffect, useState } from 'react'
import { Activity, ClipboardList, Plus, Pencil, Trash2, User, FileText, ClipboardCheck, Megaphone, BookOpen, Sparkles, Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/context/ToastContext'
import { initials, formatDateTime, cn } from '@/lib/utils'
import { fetchActivityLog, type ActivityLogRow } from '@/services/activityService'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'الآن'
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `منذ ${days} يوم`
  return formatDateTime(iso)
}

function getEntityIcon(entityType: string) {
  switch (entityType) {
    case 'student': return User
    case 'lesson': return BookOpen
    case 'homework': return FileText
    case 'submission': return ClipboardCheck
    case 'quiz': return Sparkles
    case 'announcement': return Megaphone
    case 'grade': return Award
    default: return ClipboardList
  }
}

function getActionIcon(actionType: string) {
  switch (actionType) {
    case 'create': return { icon: Plus, color: 'text-emerald-600 bg-emerald-50' }
    case 'update': return { icon: Pencil, color: 'text-blue-600 bg-blue-50' }
    case 'delete': return { icon: Trash2, color: 'text-rose-600 bg-rose-50' }
    default: return { icon: Activity, color: 'text-gray-600 bg-gray-50' }
  }
}

export default function AssistantPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<ActivityLogRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivityLog(200)
      .then(setLogs)
      .catch((err) =>
        toast({
          title: err instanceof Error ? err.message : 'تعذّر تحميل السجل',
          variant: 'error',
        }),
      )
      .finally(() => setLoading(false))
  }, [toast])

  // نجمّع حسب المستخدم (الـ Assistant)
  const byUser = logs.reduce<Record<string, { name: string; count: number; lastAt: string }>>((acc, log) => {
    if (!acc[log.userId]) {
      acc[log.userId] = { name: log.userName, count: 0, lastAt: log.createdAt }
    }
    acc[log.userId].count++
    if (new Date(log.createdAt) > new Date(acc[log.userId].lastAt)) {
      acc[log.userId].lastAt = log.createdAt
    }
    return acc
  }, {})

  const stats = {
    total: logs.length,
    today: logs.filter((l) => Date.now() - new Date(l.createdAt).getTime() < 24 * 60 * 60 * 1000).length,
    week: logs.filter((l) => Date.now() - new Date(l.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000).length,
    assistants: Object.keys(byUser).length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">الاسيستنت</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          متابعة أنشطة المساعدين على المنصة
        </p>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-xl bg-[var(--color-brand-50)] flex items-center justify-center mb-3">
              <Activity className="h-4.5 w-4.5 text-[var(--color-brand-500)]" />
            </div>
            <p className="font-display text-2xl font-extrabold">{stats.total}</p>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">إجمالي الأنشطة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <Activity className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <p className="font-display text-2xl font-extrabold">{stats.today}</p>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">أنشطة اليوم</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
              <Activity className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <p className="font-display text-2xl font-extrabold">{stats.week}</p>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">أنشطة الأسبوع</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
              <User className="h-4.5 w-4.5 text-indigo-600" />
            </div>
            <p className="font-display text-2xl font-extrabold">{stats.assistants}</p>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">عدد المساعدين</p>
          </CardContent>
        </Card>
      </div>

      {/* ملخص المساعدين */}
      {Object.keys(byUser).length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-display font-bold text-lg mb-4">ملخص المساعدين</h3>
            <div className="space-y-3">
              {Object.entries(byUser).map(([userId, data]) => (
                <div
                  key={userId}
                  className="flex items-center gap-3 rounded-xl bg-black/[0.02] dark:bg-white/5 p-3"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">{initials(data.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{data.name}</p>
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      آخر نشاط: {timeAgo(data.lastAt)}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-600)] px-3 py-1 text-xs font-bold">
                    {data.count} عملية
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* السجل */}
      <Card>
        <CardContent className="p-0">
          <div className="p-5 border-b border-black/5 dark:border-[var(--color-dark-border)]">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[var(--color-brand-500)]" />
              سجل الأنشطة
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-14">
              <div className="h-8 w-8 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-14 text-[var(--color-ink-soft)]">
              <ClipboardList className="h-10 w-10 mx-auto opacity-40 mb-3" />
              لا توجد أنشطة مسجّلة بعد
            </div>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-[var(--color-dark-border)]">
              {logs.map((log) => {
                const EntityIcon = getEntityIcon(log.entityType)
                const action = getActionIcon(log.actionType)
                const ActionIcon = action.icon

                return (
                  <div key={log.id} className="p-4 flex items-start gap-3">
                    <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', action.color)}>
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{log.userName}</span>
                        <span className="text-xs text-[var(--color-ink-soft)]">•</span>
                        <span className="text-xs text-[var(--color-ink-soft)] flex items-center gap-1">
                          <EntityIcon className="h-3 w-3" />
                          {log.entityType}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{log.description}</p>
                      <p className="text-xs text-[var(--color-ink-soft)] mt-1">
                        {timeAgo(log.createdAt)} — {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}