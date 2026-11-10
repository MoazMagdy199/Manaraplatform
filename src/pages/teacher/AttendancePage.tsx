import { useEffect, useState, useRef } from 'react'
import { CalendarCheck, Check, X, Settings2, Users, UploadCloud, ScanLine } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/context/ToastContext'
import { useData } from '@/context/DataContext'
import { GRADES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  fetchAttendanceForDate,
  saveAttendance,
  fetchSchedule,
  replaceSchedule,
} from '@/services/attendanceService'
import type { AttendanceRow, AttendanceStatus } from '@/types'

const WEEKDAYS = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الإثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function AttendancePage() {
  const { toast } = useToast()
  const { attendanceSummary } = useData()
 
  const [grade, setGrade] = useState<string>(GRADES[0])
  const [date, setDate] = useState(todayISO())
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleDays, setScheduleDays] = useState<Set<number>>(new Set())
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null) // 👈 عشان نفتح ملف الـ CSV
  const searchInputRef = useRef<HTMLInputElement>(null) // 👈 عشان السكانر

  async function loadAttendance() {
    setLoading(true)
    try {
      const data = await fetchAttendanceForDate(grade, date)
      setRows(data)
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر تحميل بيانات الحضور', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttendance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, date])

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRows((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)))
  }

  function markAll(status: 'present' | 'absent') {
    setRows((prev) => prev.map((r) => ({ ...r, status })))
  }

  // 👈 دالة استقبال كود السكانر
  function handleScan(e: React.FormEvent) {
    e.preventDefault()
    if (!searchInputRef.current) return
    
    const scannedCode = searchInputRef.current.value.trim()
    if (!scannedCode) return

    // بندور على الطالب بالـ username (اللي هو الكود اللي في الـ QR)
    const student = rows.find(r => r.username === scannedCode || r.studentId === scannedCode)

    if (student) {
      setStatus(student.studentId, 'present')
      toast({ title: `تم تسجيل حضور: ${student.name}`, variant: 'success' })
    } else {
      toast({ title: 'هذا الكود غير مسجل في هذا الصف', variant: 'error' })
    }

    // بنفضي الخانة عشان يبقى جاهز للطالب اللي بعده
    searchInputRef.current.value = ''
  }

  async function handleSave() {
    const unmarked = rows.filter((r) => !r.status)
    if (unmarked.length > 0) {
      toast({ title: `لسه فيه ${unmarked.length} طالب من غير تحديد حاضر/غائب`, variant: 'error' })
      return
    }
    setSaving(true)
    try {
      await saveAttendance(
        date,
        rows.map((r) => ({ studentId: r.studentId, status: r.status as 'present' | 'absent' })),
      )
      toast({ title: 'تم حفظ الحضور بنجاح', variant: 'success' })
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر حفظ الحضور', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // 👈 دالة استيراد ملف الـ CSV
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
      if (lines.length < 2) return toast({ title: 'الملف فاضي أو غير صالح', variant: 'error' })

      const dataLines = lines.slice(1)
      const scannedUsernames = new Set<string>()
      
      dataLines.forEach((line) => {
        const parts = line.split(',')
        if (parts.length >= 1) {
          const username = parts[0].replace(/"/g, '').trim()
          if (username) {
            scannedUsernames.add(username)
          }
        }
      })

      let matchCount = 0
      setRows((prevRows) =>
        prevRows.map((row) => {
          if (scannedUsernames.has(row.username)) {
            matchCount++
            return { ...row, status: 'present' }
          }
          return row
        })
      )

      setTimeout(() => {
        toast({ 
          title: `تم استيراد ${matchCount} طالب بنجاح`, 
          description: 'اضغط على "حفظ الحضور" لتثبيت التغييرات.',
          variant: 'success' 
        })
      }, 100)
    }
    
    reader.readAsText(file)
    e.target.value = ''
  }

  async function openSchedule() {
    setScheduleOpen(true)
    setLoadingSchedule(true)
    try {
      const days = await fetchSchedule(grade)
      setScheduleDays(new Set(days.map((d) => d.dayOfWeek)))
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر تحميل الجدول', variant: 'error' })
    } finally {
      setLoadingSchedule(false)
    }
  }

  function toggleDay(day: number) {
    setScheduleDays((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  async function saveScheduleDays() {
    setSavingSchedule(true)
    try {
      await replaceSchedule(grade, Array.from(scheduleDays))
      toast({ title: 'تم حفظ جدول الحصص الأسبوعي', variant: 'success' })
      setScheduleOpen(false)
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر حفظ الجدول', variant: 'error' })
    } finally {
      setSavingSchedule(false)
    }
  }

  const presentCount = rows.filter((r) => r.status === 'present').length
  const absentCount = rows.filter((r) => r.status === 'absent').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold">الحضور والغياب</h2>
          <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
            سجّل حضور الطلاب يومياً حسب الصف
          </p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleCSVImport} 
          />
          <Button variant="default" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud className="h-4 w-4" /> استيراد حضور (أوفلاين)
          </Button>
          
          <Button variant="outline" onClick={openSchedule}>
            <Settings2 className="h-4 w-4" /> الجدول الأسبوعي
          </Button>
        </div>
      </div>

      {/* 👈 مربع السكانر */}
      <Card className="border-[var(--color-brand-200)] bg-[var(--color-brand-50)]/30 dark:bg-[var(--color-brand-900)]/10 dark:border-[var(--color-brand-800)]">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-[var(--color-brand-500)] text-white flex items-center justify-center shrink-0">
            <ScanLine className="h-5 w-5" />
          </div>
          <form onSubmit={handleScan} className="flex-1">
            <Label className="mb-1 block">مسح كارت الطالب (سكانر)</Label>
            <Input 
              ref={searchInputRef}
              placeholder="قم بتمرير كارت الـ QR أمام الجهاز هنا..."
              autoFocus
              className="text-lg"
            />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 grid sm:grid-cols-2 gap-4">
          <div>
            <Label>الصف الدراسي</Label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm dark:bg-[var(--color-dark-surface-2)] dark:border-[var(--color-dark-border)]"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>التاريخ</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {!loading && rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] flex items-center gap-1.5">
            <Users className="h-4 w-4" /> {rows.length} طالب — حاضر: {presentCount} — غائب: {absentCount}
          </span>
          <div className="flex gap-2 mr-auto">
            <Button size="sm" variant="outline" onClick={() => markAll('present')}>
              تحديد الكل حاضر
            </Button>
            <Button size="sm" variant="outline" onClick={() => markAll('absent')}>
              تحديد الكل غائب
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-14">
              <div className="h-8 w-8 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-14 text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
              <CalendarCheck className="h-10 w-10 mx-auto opacity-40 mb-3" />
              لا يوجد طلاب في هذا الصف
            </div>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-[var(--color-dark-border)]">
              {rows.map((r) => (
                <div key={r.studentId} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold text-sm">{r.name}</p>
                    <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                      @{r.username}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus(r.studentId, 'present')}
                      className={cn(
                        'h-9 w-9 rounded-xl flex items-center justify-center border-2 transition-colors',
                        r.status === 'present'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-black/10 dark:border-[var(--color-dark-border)] text-[var(--color-ink-soft)] hover:border-emerald-400',
                      )}
                      title="حاضر"
                    >
                      <Check className="h-4.5 w-4.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(r.studentId, 'absent')}
                      className={cn(
                        'h-9 w-9 rounded-xl flex items-center justify-center border-2 transition-colors',
                        r.status === 'absent'
                          ? 'bg-[var(--color-rose-500)] border-[var(--color-rose-500)] text-white'
                          : 'border-black/10 dark:border-[var(--color-dark-border)] text-[var(--color-ink-soft)] hover:border-[var(--color-rose-400,#e08080)]',
                      )}
                      title="غائب"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && rows.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ الحضور'}
          </Button>
        </div>
      )}

      {/* Weekly schedule dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>الجدول الأسبوعي — {grade}</DialogTitle>
            <DialogDescription>حدّد الأيام اللي فيها حصص لهذا الصف (اختياري، للتذكير فقط)</DialogDescription>
          </DialogHeader>
          {loadingSchedule ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={cn(
                    'rounded-xl border-2 p-3 text-sm font-semibold transition-colors',
                    scheduleDays.has(d.value)
                      ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/30'
                      : 'border-black/10 dark:border-[var(--color-dark-border)] hover:bg-black/[0.02] dark:hover:bg-white/5',
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={saveScheduleDays} disabled={savingSchedule || loadingSchedule}>
              {savingSchedule ? 'جاري الحفظ...' : 'حفظ الجدول'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}