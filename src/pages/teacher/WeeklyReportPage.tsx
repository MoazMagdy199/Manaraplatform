import { useEffect, useState } from 'react'
import { FileBarChart, ClipboardCheck, CalendarCheck, AlertCircle, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/context/ToastContext'
import { GRADES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { fetchWeeklyReport, type WeeklyReport } from '@/services/weeklyReportService'
function sevenDaysAgoISO() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

export default function WeeklyReportPage() {
  const { toast } = useToast()

  const [grade, setGrade] = useState<string>(GRADES[0])
  const [since] = useState(sevenDaysAgoISO())
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedHomework, setExpandedHomework] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchWeeklyReport(grade, since)
      .then(setReport)
      .catch((err) => toast({ title: err instanceof Error ? err.message : 'تعذّر تحميل التقرير', variant: 'error' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade])

  const attendanceTotal = report ? report.attendance.presentCount + report.attendance.absentCount : 0
  const attendancePct = attendanceTotal > 0 ? Math.round((report!.attendance.presentCount / attendanceTotal) * 100) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold">التقرير الأسبوعي</h2>
          <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
            ملخص آخر 7 أيام — الواجبات والحضور ومين محتاج متابعة
          </p>
        </div>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm shadow-sm dark:bg-[var(--color-dark-surface-2)] dark:border-[var(--color-dark-border)]"
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
        </div>
      ) : report ? (
        <>
          {/* Summary cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="h-9 w-9 rounded-xl bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/40 flex items-center justify-center mb-3">
                  <ClipboardCheck className="h-4.5 w-4.5 text-[var(--color-brand-500)]" />
                </div>
                <p className="font-display text-2xl font-extrabold">{report.homeworks.length}</p>
                <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                  واجب اتضاف الأسبوع ده
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="h-9 w-9 rounded-xl bg-[var(--color-amber-100)] flex items-center justify-center mb-3">
                  <CalendarCheck className="h-4.5 w-4.5 text-[var(--color-amber-600)]" />
                </div>
                <p className="font-display text-2xl font-extrabold">
                  {attendancePct !== null ? `${attendancePct}%` : '—'}
                </p>
                <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                  نسبة الحضور ({report.attendance.daysMarked} يوم مسجّل)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="h-9 w-9 rounded-xl bg-[var(--color-rose-100)] flex items-center justify-center mb-3">
                  <AlertCircle className="h-4.5 w-4.5 text-[var(--color-rose-500)]" />
                </div>
                <p className="font-display text-2xl font-extrabold">{report.needsAttention.length}</p>
                <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                  طالب محتاج متابعة
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Students needing attention */}
          {report.needsAttention.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[var(--color-rose-500)]" /> محتاجين متابعة
                </h3>
                <div className="space-y-2">
                  {report.needsAttention.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl bg-[var(--color-rose-100)]/40 p-3.5"
                    >
                      <p className="font-semibold text-sm">{s.name}</p>
                      <div className="flex gap-2">
                        {s.missedHomeworkCount > 0 && (
                          <Badge variant="rose">{s.missedHomeworkCount} واجب فايت</Badge>
                        )}
                        {s.absentCount > 0 && <Badge variant="rose">{s.absentCount} يوم غياب</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Homework breakdown */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-[var(--color-brand-500)]" /> تفاصيل الواجبات
              </h3>
              {report.homeworks.length === 0 ? (
                <p className="text-sm text-center text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] py-6">
                  مفيش واجبات اتضافت لهذا الصف في آخر 7 أيام
                </p>
              ) : (
                <div className="space-y-3">
                  {report.homeworks.map((h) => {
                    const expanded = expandedHomework === h.homeworkId
                    return (
                      <div
                        key={h.homeworkId}
                        className="rounded-xl border border-black/5 dark:border-[var(--color-dark-border)] overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedHomework(expanded ? null : h.homeworkId)}
                          className="w-full flex items-center justify-between p-4 text-right hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
                        >
                          <div>
                            <p className="font-semibold text-sm">{h.title}</p>
                            <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-0.5">
                              اتضاف {formatDate(h.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={h.submittedCount === h.totalStudents ? 'success' : 'amber'}>
                              {h.submittedCount}/{h.totalStudents} سلّموا
                            </Badge>
                            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        {expanded && (
                          <div className="border-t border-black/5 dark:border-[var(--color-dark-border)] p-4 bg-black/[0.01] dark:bg-white/[0.02]">
                            {h.missingStudents.length === 0 ? (
                              <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                                كل الطلاب سلّموا 🎉
                              </p>
                            ) : (
                              <>
                                <p className="text-xs font-semibold text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mb-2">
                                  لسه ما سلّموش:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {h.missingStudents.map((s) => (
                                    <Badge key={s.id} variant="rose">
                                      {s.name}
                                    </Badge>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
