import { useEffect, useMemo, useState } from 'react'
import { Search, Phone, Users, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/context/ToastContext'
import { initials } from '@/lib/utils'
import { fetchGroups, type Group } from '@/services/groupsService'
import { fetchStudents } from '@/services/studentsService'
import { GRADES } from '@/lib/constants'
import type { User } from '@/types'

export default function ContactsPage() {
  const { toast } = useToast()

  const [students, setStudents] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')

  useEffect(() => {
    Promise.all([fetchStudents(), fetchGroups()])
      .then(([s, g]) => {
        setStudents(s)
        setGroups(g)
      })
      .catch((err) =>
        toast({
          title: err instanceof Error ? err.message : 'تعذّر تحميل البيانات',
          variant: 'error',
        }),
      )
      .finally(() => setLoading(false))
  }, [toast])

  const filtered = useMemo(() => {
    const q = query.trim()
    return students.filter((s) => {
      if (gradeFilter && s.grade !== gradeFilter) return false
      if (groupFilter === '__none__' && s.groupId !== null) return false
      if (groupFilter && groupFilter !== '__none__' && s.groupId !== groupFilter) return false
      if (q && !s.name.includes(q) && !s.username.includes(q) && !s.phone.includes(q)) return false
      return true
    })
  }, [students, query, gradeFilter, groupFilter])

  function groupName(id?: string | null) {
    if (!id) return '—'
    return groups.find((g) => g.id === id)?.name || '—'
  }

  function openWhatsApp(phone: string, name: string) {
    if (!phone) {
      toast({ title: 'مفيش رقم متسجّل', variant: 'error' })
      return
    }
    const clean = phone.replace(/\D/g, '')
    let fullPhone = clean
    if (!fullPhone.startsWith('20')) {
      fullPhone = fullPhone.startsWith('0') ? `20${fullPhone.slice(1)}` : `20${fullPhone}`
    }
    const msg = `السلام عليكم، معاك سكرتيرة مستر معاذ مجدي.`
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">جهات الاتصال</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          كل أرقام الطلاب وأولياء الأمور في مكان واحد
        </p>
      </div>

      {/* الفلاتر */}
      <Card>
        <CardContent className="p-5">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>بحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-soft)]" />
                <Input
                  placeholder="بالاسم أو اسم المستخدم أو الرقم..."
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
              <Users className="h-10 w-10 mx-auto opacity-40 mb-3" />
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
                    <th className="text-right font-semibold p-4">رقم الطالب</th>
                    <th className="text-right font-semibold p-4">ولي الأمر</th>
                    <th className="text-right font-semibold p-4">رقم ولي الأمر</th>
                    <th className="text-right font-semibold p-4 hidden sm:table-cell">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-black/5 dark:border-[var(--color-dark-border)] last:border-0 hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs">{initials(s.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{s.name}</p>
                            <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                              @{s.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                        {s.grade || '—'}
                      </td>
                      <td className="p-4 hidden lg:table-cell text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                        {groupName(s.groupId)}
                      </td>
                      <td className="p-4" dir="ltr">
                        {s.phone || '—'}
                      </td>
                      <td className="p-4">
                        {s.parentName || '—'}
                      </td>
                      <td className="p-4" dir="ltr">
                        {s.parentPhone || '—'}
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <div className="flex gap-1">
                          {s.phone && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openWhatsApp(s.phone, s.name)}
                              title="واتساب الطالب"
                            >
                              <Phone className="h-4 w-4 text-brand-600" />
                            </Button>
                          )}
                          {s.parentPhone && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openWhatsApp(s.parentPhone!, s.parentName || s.name)}
                              title="واتساب ولي الأمر"
                            >
                              <MessageCircle className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}