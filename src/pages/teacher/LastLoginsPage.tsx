import { useEffect, useMemo, useState } from 'react'
import { Clock, Search, Users, UserCheck, UserX, AlertCircle, Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Link } from 'react-router-dom'
import { useToast } from '@/context/ToastContext'
import { initials, formatDateTime } from '@/lib/utils'
import { fetchGroups, type Group } from '@/services/groupsService'
import { fetchAllStudentsLastLogin, type LastLoginRow } from '@/services/lastLoginsService'
import { GRADES } from '@/lib/constants'

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'الآن'
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `منذ ${days} يوم`
  const months = Math.floor(days / 30)
  return `منذ ${months} شهر`
}

function activityStatus(iso: string | null): { label: string; color: string } {
  if (!iso) return { label: 'لم يسجّل', color: 'text-[var(--color-ink-soft)] bg-black/5' }
  const days = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
  if (days <= 1) return { label: 'نشط اليوم', color: 'text-emerald-600 bg-emerald-50' }
  if (days <= 7) return { label: 'نشط هذا الأسبوع', color: 'text-brand-600 bg-[var(--color-brand-50)]' }
  if (days <= 30) return { label: 'نشط هذا الشهر', color: 'text-amber-600 bg-amber-50' }
  return { label: 'غير نشط', color: 'text-rose-600 bg-rose-50' }
}

export default function LastLoginsPage() {
  const { toast } = useToast()

  const [rows, setRows] = useState<LastLoginRow[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')

  useEffect(() => {
    Promise.all([fetchAllStudentsLastLogin(), fetchGroups()])
      .then(([students, gs]) => {
        setRows(students)
        setGroups(gs)
      })
      .catch((err) =>
        toast({
          title: err instanceof Error ? err.message : 'تعذّر تحميل بيانات تسجيلات الدخول',
          variant: 'error',
        }),
      )
      .finally(() => setLoading(false))
  }, [toast])

  const filtered = useMemo(() => {
    const q = query.trim()
    return rows.filter((r) => {
      if (gradeFilter && r.grade !== gradeFilter) return false
      if (groupFilter === '__none__' && r.groupId !== null) return false
      if (groupFilter && groupFilter !== '__none__' && r.groupId !== groupFilter) return false
      if (q && !r.name.includes(q) && !r.username.includes(q)) return false
      return true
    })
  }, [rows, query, gradeFilter, groupFilter])

  // إحصائيات
  const stats = useMemo(() => {
    const total = rows.length
    const today = rows.filter((r) => r.lastSeenAt && Date.now() - new Date(r.lastSeenAt).getTime() < 24 * 60 * 60 * 1000).length
    const week = rows.filter((r) => r.lastSeenAt && Date.now() - new Date(r.lastSeenAt).getTime() < 7 * 24 * 60 * 60 * 1000).length
    const never = rows.filter((r) => !r.lastSeenAt).length
    return { total, today, week, never }
  }, [rows])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">آخر تسجيلات الدخول</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          متابعة نشاط الطلاب وتسجيل دخولهم للمنصة
        </p>
      </div>

      {/* كروت الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-xl bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/40 flex items-center justify-center mb-3">
              <Users className="h-4.5 w-4.5 text-[var(--color-brand-500)]" />
            </div>
            <p className="font-display text-2xl font-extrabold">{stats.total}</p>
            <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
              إجمالي الطلاب
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
              <UserCheck className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <p className="font-display text-2xl font-extrabold">{stats.today}</p>
            <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
              نشط اليوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-xl bg-[var(--color-amber-100)] flex items-center justify-center mb-3">
              <Clock className="h-4.5 w-4.5 text-[var(--color-amber-600)]" />
            </div>
            <p className="font-display text-2xl font-extrabold">{stats.week}</p>
            <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
              نشط هذا الأسبوع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-xl bg-[var(--color-rose-100)] flex items-center justify-center mb-3">
              <AlertCircle className="h-4.5 w-4.5 text-[var(--color-rose-500)]" />
            </div>
            <p className="font-display text-2xl font-extrabold">{stats.never}</p>
            <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
              لم يسجّلوا بعد
            </p>
          </CardContent>
        </Card>
      </div>

      {/* الفلاتر */}
      <Card>
        <CardContent className="p-5">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Label>بحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-soft)]" />
                <Input
                  placeholder="بالاسم أو اسم المستخدم..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div>
              <Label>الصف</Label>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm dark:bg-[var(--color-dark-surface-2)] dark:border-[var(--color-dark-border)]"
              >
                <option value="">كل الصفوف</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>المجموعة</Label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm dark:bg-[var(--color-dark-surface-2)] dark:border-[var(--color-dark-border)]"
              >
                <option value="">كل المجموعات</option>
                <option value="__none__">بدون مجموعة</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الجدول */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-14">
              <div className="h-8 w-8 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
              <Clock className="h-10 w-10 mx-auto opacity-40 mb-3" />
              لا توجد نتائج مطابقة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5 dark:border-[var(--color-dark-border)] text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                    <th className="text-right font-semibold p-4">الطالب</th>
                    <th className="text-right font-semibold p-4 hidden md:table-cell">الصف</th>
                    <th className="text-right font-semibold p-4 hidden lg:table-cell">المجموعة</th>
                    <th className="text-right font-semibold p-4">آخر نشاط</th>
                    <th className="text-right font-semibold p-4 hidden sm:table-cell">آخر دخول</th>
                    <th className="text-right font-semibold p-4 hidden xl:table-cell">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const status = activityStatus(r.lastSeenAt)
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-black/5 dark:border-[var(--color-dark-border)] last:border-0 hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-xs">{initials(r.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Link
                                to={`/teacher/students/${r.id}`}
                                className="font-semibold hover:text-[var(--color-brand-600)] hover:underline"
                              >
                                {r.name}
                              </Link>
                              <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                                @{r.username}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                          {r.grade || '—'}
                        </td>
                        <td className="p-4 hidden lg:table-cell text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                          {r.groupName || '—'}
                        </td>
                        <td className="p-4">
                          {r.lastSeenAt ? (
                            <>
                              <p className="font-semibold flex items-center gap-1.5">
                                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                                {timeAgo(r.lastSeenAt)}
                              </p>
                              <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                                {formatDateTime(r.lastSeenAt)}
                              </p>
                            </>
                          ) : (
                            <span className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                              لم يفتح المنصة بعد
                            </span>
                          )}
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          {r.lastSignInAt ? (
                            <>
                              <p className="text-sm">{timeAgo(r.lastSignInAt)}</p>
                              <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                                {formatDateTime(r.lastSignInAt)}
                              </p>
                            </>
                          ) : (
                            <span className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                              —
                            </span>
                          )}
                        </td>
                        <td className="p-4 hidden xl:table-cell">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}