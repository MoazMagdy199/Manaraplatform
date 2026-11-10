import { useEffect, useState } from 'react'
import { Wallet, Check, X, Users, TrendingUp, Banknote, AlertCircle } from 'lucide-react'
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
import { GRADES } from '@/lib/constants'
import { cn, formatDate } from '@/lib/utils'
import {
  fetchPaymentsForMonth,
  setPaymentStatus,
  fetchPaymentsOverview,
  requestPaymentChange,
  fetchPaymentsSummary,
  type PaymentsSummary,
} from '@/services/paymentsService'
import type { PaymentRow, PaymentsOverviewRow } from '@/types'

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

function currentMonthValue() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(value: string) {
  const [y, m] = value.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

export default function PaymentsPage() {
  const { toast } = useToast()

  const [grade, setGrade] = useState<string>(GRADES[0])
  const [month, setMonth] = useState(currentMonthValue())
  
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(false)

  const [overview, setOverview] = useState<PaymentsOverviewRow[]>([])
  const [summary, setSummary] = useState<PaymentsSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  const [noteTarget, setNoteTarget] = useState<PaymentRow | null>(null)
  const [amountVal, setAmountVal] = useState('')
  const [notesVal, setNotesVal] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  async function loadPayments() {
    setLoading(true)
    try {
      const data = await fetchPaymentsForMonth(grade, month)
      setRows(data)
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر تحميل بيانات الاشتراك', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function loadOverview() {
    try {
      const data = await fetchPaymentsOverview(month)
      setOverview(data)
    } catch {
      // صامت
    }
  }

  async function loadSummary() {
    setLoadingSummary(true)
    try {
      const data = await fetchPaymentsSummary(month)
      setSummary(data)
    } catch {
      // صامت
    } finally {
      setLoadingSummary(false)
    }
  }

  useEffect(() => {
    loadPayments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, month])

  useEffect(() => {
    loadOverview()
    loadSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  async function togglePaid(row: PaymentRow) {
    const next = !row.paid

    setRows((prev) => prev.map((r) => (r.studentId === row.studentId ? { ...r, paid: next } : r)))
    try {
      await setPaymentStatus(row.studentId, month, next, row.amount, row.notes)
      loadOverview()
      loadSummary()
    } catch (err) {
      setRows((prev) => prev.map((r) => (r.studentId === row.studentId ? { ...r, paid: !next } : r)))
      toast({ title: err instanceof Error ? err.message : 'تعذّر تحديث الحالة', variant: 'error' })
    }
  }

  function openNote(row: PaymentRow) {
    setNoteTarget(row)
    setAmountVal(row.amount != null ? String(row.amount) : '')
    setNotesVal(row.notes || '')
  }

  async function saveNote() {
    if (!noteTarget) return
    setSavingNote(true)
    try {
      const amount = amountVal.trim() ? Number(amountVal) : null
      const notes = notesVal.trim() || null

      await setPaymentStatus(noteTarget.studentId, month, noteTarget.paid, amount, notes)
      setRows((prev) =>
        prev.map((r) =>
          r.studentId === noteTarget.studentId ? { ...r, amount, notes } : r,
        ),
      )
      toast({ title: 'تم الحفظ', variant: 'success' })
      setNoteTarget(null)
      loadSummary()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر الحفظ', variant: 'error' })
    } finally {
      setSavingNote(false)
    }
  }

  const paidCount = rows.filter((r) => r.paid).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">متابعة الاشتراك الشهري</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          تابع مين دفع ومين لسه لكل شهر
        </p>
      </div>

      {/* كروت الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[var(--color-brand-200)] dark:border-[var(--color-brand-900)]">
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-xl bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/40 flex items-center justify-center mb-3">
              <Banknote className="h-4.5 w-4.5 text-[var(--color-brand-600)]" />
            </div>
            <p className="font-display text-2xl font-extrabold">
              {loadingSummary ? '...' : (summary?.totalExpected || 0).toLocaleString()} <span className="text-sm font-normal">ج.م</span>
            </p>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">إجمالي الاشتراكات المتوقعة</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900/50">
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <p className="font-display text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {loadingSummary ? '...' : (summary?.totalPaid || 0).toLocaleString()} <span className="text-sm font-normal">ج.م</span>
            </p>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">تم تحصيلها ({summary?.paidCount || 0} طالب)</p>
          </CardContent>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900/50">
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-xl bg-rose-50 flex items-center justify-center mb-3">
              <AlertCircle className="h-4.5 w-4.5 text-rose-600" />
            </div>
            <p className="font-display text-2xl font-extrabold text-rose-700 dark:text-rose-400">
              {loadingSummary ? '...' : (summary?.totalRemaining || 0).toLocaleString()} <span className="text-sm font-normal">ج.م</span>
            </p>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">لسه متحصلة ({summary?.unpaidCount || 0} طالب)</p>
          </CardContent>
        </Card>
      </div>

      {/* كروت ملخص الصفوف */}
      {overview.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          {overview.map((o) => (
            <Card key={o.grade} className={cn(o.grade === grade && 'ring-2 ring-[var(--color-brand-500)]')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-4 w-4 text-[var(--color-brand-500)]" />
                  <span className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                    {o.paidStudents}/{o.totalStudents}
                  </span>
                </div>
                <p className="text-sm font-semibold">{o.grade}</p>
                <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/10 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-brand-500)] rounded-full"
                    style={{ width: `${o.totalStudents ? (o.paidStudents / o.totalStudents) * 100 : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
            <Label>الشهر</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {!loading && rows.length > 0 && (
        <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] flex items-center gap-1.5">
          <Users className="h-4 w-4" /> {rows.length} طالب — دفع: {paidCount} — لسه لأ: {rows.length - paidCount} —
          شهر {monthLabel(month)}
        </p>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-14">
              <div className="h-8 w-8 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-14 text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
              <Wallet className="h-10 w-10 mx-auto opacity-40 mb-3" />
              لا يوجد طلاب في هذا الصف
            </div>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-[var(--color-dark-border)]">
              {rows.map((r) => (
                <button
                  key={r.studentId}
                  type="button"
                  onClick={() => openNote(r)}
                  className="w-full flex items-center justify-between p-4 text-right hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
                >
                  <div>
                    <p className="font-semibold text-sm">{r.name}</p>
                    <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                      @{r.username}
                      {r.amount != null && ` — ${r.amount} جنيه`}
                      {r.paidAt && ` — دفع في ${formatDate(r.paidAt)}`}
                    </p>
                    {r.notes && (
                      <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-0.5 italic">
                        {r.notes}
                      </p>
                    )}
                  </div>
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePaid(r)
                    }}
                    className={cn(
                      'h-9 w-9 rounded-xl flex items-center justify-center border-2 shrink-0 transition-colors',
                      r.paid
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-black/10 dark:border-[var(--color-dark-border)] text-[var(--color-ink-soft)] hover:border-[var(--color-rose-400,#e08080)]',
                    )}
                    title={r.paid ? 'دفع — دوس تلغي' : 'لسه ما دفعش — دوس لتأكيد الدفع'}
                  >
                    {r.paid ? <Check className="h-4.5 w-4.5" /> : <X className="h-4.5 w-4.5" />}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amount + notes dialog */}
      <Dialog open={!!noteTarget} onOpenChange={(o) => !o && setNoteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{noteTarget?.name}</DialogTitle>
            <DialogDescription>
              تفاصيل الاشتراك — شهر {monthLabel(month)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>المبلغ (اختياري)</Label>
              <Input
                type="number"
                dir="ltr"
                placeholder="مثال: 300"
                value={amountVal}
                onChange={(e) => setAmountVal(e.target.value)}
              />
            </div>
            <div>
              <Label>ملاحظات (اختياري)</Label>
              <Input
                placeholder="مثال: دفع نص المبلغ بس"
                value={notesVal}
                onChange={(e) => setNotesVal(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteTarget(null)}>
              إلغاء
            </Button>
            <Button onClick={saveNote} disabled={savingNote}>
              {savingNote ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}