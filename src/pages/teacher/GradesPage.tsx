import { useEffect, useState } from 'react'
import { Plus, Trash2, Award, Users, ClipboardList, Trophy, MessageCircle, Percent } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { formatDate, initials, cn } from '@/lib/utils'
import {
  fetchExamsForGrade,
  createExam,
  deleteExam,
  fetchExamScores,
  setExamScore,
  fetchExamRanking,
  type Exam,
  type ExamScoreRow,
  type ExamRankingRow,
} from '@/services/examsService'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

type TabType = 'exams' | 'ranking'

export default function GradesPage() {
  const { toast } = useToast()

  const [tab, setTab] = useState<TabType>('exams')
  const [grade, setGrade] = useState<string>(GRADES[0])

  // Tab 1: الامتحانات
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [maxScore, setMaxScore] = useState('')
  const [examDate, setExamDate] = useState(todayISO())
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null)

  const [scoresFor, setScoresFor] = useState<Exam | null>(null)
  const [scores, setScores] = useState<ExamScoreRow[]>([])
  const [loadingScores, setLoadingScores] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)

  // Tab 2: الترتيب
  const [rankingExam, setRankingExam] = useState<string>('')
  const [ranking, setRanking] = useState<ExamRankingRow[]>([])
  const [loadingRanking, setLoadingRanking] = useState(false)

  // ==========================================
  // تحميل الامتحانات
  // ==========================================

  async function loadExams() {
    setLoading(true)
    try {
      const data = await fetchExamsForGrade(grade)
      setExams(data)
      if (data.length > 0 && !rankingExam) {
        setRankingExam(data[0].id)
      }
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر تحميل الامتحانات', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // تحميل الترتيب
  // ==========================================

  async function loadRanking() {
    if (!rankingExam) {
      setRanking([])
      return
    }
    setLoadingRanking(true)
    try {
      const data = await fetchExamRanking(rankingExam)
      setRanking(data)
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر تحميل الترتيب', variant: 'error' })
    } finally {
      setLoadingRanking(false)
    }
  }

  useEffect(() => {
    if (tab === 'exams') loadExams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, tab])

  useEffect(() => {
    if (tab === 'ranking') loadRanking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankingExam, tab])

  function openCreate() {
    setTitle('')
    setMaxScore('')
    setExamDate(todayISO())
    setCreateOpen(true)
  }

  async function handleCreate() {
    if (!title.trim() || !maxScore || Number(maxScore) <= 0) {
      toast({ title: 'يرجى تعبئة اسم الامتحان والدرجة النهائية', variant: 'error' })
      return
    }
    setSaving(true)
    try {
      await createExam(grade, title.trim(), Number(maxScore), examDate)
      toast({ title: 'تم إنشاء الامتحان بنجاح', variant: 'success' })
      setCreateOpen(false)
      loadExams()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر إنشاء الامتحان', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteExam(deleteTarget.id)
      toast({ title: 'تم حذف الامتحان', variant: 'success' })
      setDeleteTarget(null)
      loadExams()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر حذف الامتحان', variant: 'error' })
    }
  }

  async function openScores(exam: Exam) {
    setScoresFor(exam)
    setLoadingScores(true)
    try {
      const data = await fetchExamScores(exam.id)
      setScores(data)
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر تحميل الدرجات', variant: 'error' })
      setScores([])
    } finally {
      setLoadingScores(false)
    }
  }

  async function handleScoreChange(studentId: string, value: string) {
    setScores((prev) => prev.map((s) => (s.studentId === studentId ? { ...s, score: value === '' ? null : Number(value) } : s)))
  }

  async function saveScore(studentId: string) {
    if (!scoresFor) return
    const row = scores.find((s) => s.studentId === studentId)
    if (!row || row.score === null || isNaN(row.score)) return

    if (row.score < 0 || row.score > scoresFor.maxScore) {
      toast({ title: `الدرجة يجب أن تكون بين 0 و ${scoresFor.maxScore}`, variant: 'error' })
      return
    }

    setSavingId(studentId)
    try {
      await setExamScore(scoresFor.id, studentId, row.score)
      loadExams()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر حفظ الدرجة', variant: 'error' })
    } finally {
      setSavingId(null)
    }
  }

  // ==========================================
  // واتساب
  // ==========================================

  function buildWhatsAppMessage(student: ExamRankingRow, rank: number | null): string {
    const header = `السلام عليكم، معاك سكرتيرة مستر معاذ مجدي.\n\n`
    let body = ''

    if (student.score === null) {
      // غائب
      body = `حبينا نبلغك إن ${student.name} كان غائب عن الامتحان.\n\n` +
        `ياريت تتابع معاه عشان ميفوّتش الامتحانات الجاية.`
    } else if (rank === 1) {
      // الأول
      body = `🎉 ألف مبروك!\n\n` +
        `الطالب ${student.name} حصل على المركز الأول بدرجة ${student.score} من ${student.maxScore} (${student.percentage}%).\n\n` +
        `شكرًا لدعمكم ومتابعتكم في البيت. 🌹`
    } else if (student.percentage !== null && student.percentage >= 90) {
      body = `🎉 ألف مبروك!\n\n` +
        `الطالب ${student.name} حصل على المركز ${rank} بدرجة ${student.score} من ${student.maxScore} (${student.percentage}%).\n\n` +
        `شكرًا لدعمكم ومتابعتكم في البيت. 🌹`
    } else if (student.percentage !== null && student.percentage >= 70) {
      body = `حبينا نبلغ حضرتك بدرجة ${student.name}: ${student.score} من ${student.maxScore} (${student.percentage}%).\n\n` +
        `شكرًا لمتابعتك.`
    } else if (student.percentage !== null && student.percentage >= 50) {
      body = `حبينا نبلغ حضرتك بدرجة ${student.name}: ${student.score} من ${student.maxScore} (${student.percentage}%).\n\n` +
        `ياريت متابعة أكتر في البيت.`
    } else {
      body = `محتاجين متابعة أكتر في البيت.\n\n` +
        `درجة ${student.name}: ${student.score} من ${student.maxScore} (${student.percentage}%).`
    }

    const footer = `\n\nمع تحياتي،\nأ/ معاذ مجدي\nمدرس البرمجة`
    return header + body + footer
  }

  function sendWhatsApp(student: ExamRankingRow, rank: number | null) {
    if (!student.parentPhone) {
      toast({ title: `رقم ولي أمر ${student.name} غير مسجل`, variant: 'error' })
      return
    }

    const cleanPhone = student.parentPhone.replace(/\D/g, '')
    let fullPhone = cleanPhone
    if (!fullPhone.startsWith('20')) {
      fullPhone = fullPhone.startsWith('0') ? `20${fullPhone.slice(1)}` : `20${fullPhone}`
    }

    const message = buildWhatsAppMessage(student, rank)
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  // ==========================================
  // حساب المراكز
  // ==========================================

  // حساب المراكز بنظام "الترتيب المشترك" — كل اللي عندهم نفس الدرجة ياخدوا نفس المركز
const rankedRows = (() => {
  let currentRank = 0
  let lastScore: number | null = null
  let positionCount = 0

  return ranking.map((student) => {
    positionCount++

    // لو الدرجة مختلفة عن السابقة، المركز بيتحدّث
    if (student.score !== lastScore) {
      currentRank = positionCount
      lastScore = student.score
    }

    return { student, rank: student.score !== null ? currentRank : null }
  })
})()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold">الامتحانات والدرجات</h2>
          <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
            أنشئ امتحانات، سجّل الدرجات، وتابع ترتيب الطلاب
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
          {tab === 'exams' && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> امتحان جديد
            </Button>
          )}
        </div>
      </div>

      {/* التابات */}
      <div className="flex gap-2 border-b border-black/5 dark:border-[var(--color-dark-border)]">
        <button
          onClick={() => setTab('exams')}
          className={cn(
            'px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px',
            tab === 'exams'
              ? 'border-[var(--color-brand-500)] text-[var(--color-brand-600)]'
              : 'border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] dark:text-[var(--color-dark-ink-soft)]',
          )}
        >
          <ClipboardList className="h-4 w-4 inline ml-1.5" /> الامتحانات
        </button>
        <button
          onClick={() => setTab('ranking')}
          className={cn(
            'px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px',
            tab === 'ranking'
              ? 'border-[var(--color-brand-500)] text-[var(--color-brand-600)]'
              : 'border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] dark:text-[var(--color-dark-ink-soft)]',
          )}
        >
          <Trophy className="h-4 w-4 inline ml-1.5" /> ترتيب الطلاب
        </button>
      </div>

      {/* ============ تاب الامتحانات ============ */}
      {tab === 'exams' && (
        <>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
            </div>
          ) : exams.length === 0 ? (
            <Card>
              <CardContent className="p-14 text-center text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                <Award className="h-10 w-10 mx-auto opacity-40 mb-3" />
                لا توجد امتحانات لهذا الصف بعد
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {exams.map((e) => (
                <Card key={e.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-xl bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/40 flex items-center justify-center">
                        <Award className="h-5 w-5 text-[var(--color-brand-500)]" />
                      </div>
                      <Badge variant={e.scoredCount === e.totalStudents ? 'success' : 'amber'}>
                        <Users className="h-3 w-3" /> {e.scoredCount}/{e.totalStudents}
                      </Badge>
                    </div>
                    <h3 className="font-display font-bold mt-4">{e.title}</h3>
                    <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                      الدرجة النهائية: {e.maxScore} — {formatDate(e.examDate)}
                    </p>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/5 dark:border-[var(--color-dark-border)]">
                      <Button size="sm" className="flex-1" onClick={() => openScores(e)}>
                        <ClipboardList className="h-3.5 w-3.5" /> تسجيل الدرجات
                      </Button>
                      <Button size="sm" variant="ghost" className="hover:text-[var(--color-rose-500)]" onClick={() => setDeleteTarget(e)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ============ تاب الترتيب ============ */}
      {tab === 'ranking' && (
        <>
          {exams.length === 0 ? (
            <Card>
              <CardContent className="p-14 text-center text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                <Trophy className="h-10 w-10 mx-auto opacity-40 mb-3" />
                لازم تنشئ امتحان الأول عشان تشوف الترتيب
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-5">
                  <Label>اختر الامتحان</Label>
                  <select
                    value={rankingExam}
                    onChange={(e) => setRankingExam(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm dark:bg-[var(--color-dark-surface-2)] dark:border-[var(--color-dark-border)]"
                  >
                    {exams.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title} — من {e.maxScore} ({formatDate(e.examDate)})
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>

              {loadingRanking ? (
                <div className="flex justify-center py-20">
                  <div className="h-8 w-8 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
                </div>
              ) : ranking.length === 0 ? (
                <Card>
                  <CardContent className="p-14 text-center text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                    <Trophy className="h-10 w-10 mx-auto opacity-40 mb-3" />
                    لا يوجد طلاب في هذا الصف
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-black/5 dark:border-[var(--color-dark-border)] text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                            <th className="text-right font-semibold p-4 w-16">#</th>
                            <th className="text-right font-semibold p-4">الطالب</th>
                            <th className="text-right font-semibold p-4">الدرجة</th>
                            <th className="text-right font-semibold p-4">النسبة</th>
                            <th className="text-right font-semibold p-4">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankedRows.map(({ student, rank }) => {
                            const isAbsent = student.score === null
                            const isTop3 = rank !== null && rank <= 3
                            const isFirst = rank === 1

                            return (
                              <tr
                                key={student.studentId}
                                className={cn(
                                  'border-b border-black/5 dark:border-[var(--color-dark-border)] last:border-0',
                                  isFirst && 'bg-[var(--color-amber-50)] dark:bg-[var(--color-amber-900)]/20',
                                  isAbsent && 'opacity-60',
                                )}
                              >
                                <td className="p-4">
                                  {isAbsent ? (
                                    <span className="inline-flex items-center rounded-full bg-rose-100 text-rose-700 px-2.5 py-1 text-xs font-bold">
                                      غائب
                                    </span>
                                  ) : (
                                    <div
                                      className={cn(
                                        'h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs',
                                        rank === 1 && 'bg-[var(--color-amber-500)] text-white',
                                        rank === 2 && 'bg-gray-300 text-gray-800',
                                        rank === 3 && 'bg-[#CD7F32] text-white',
                                        !isTop3 && 'bg-black/5 dark:bg-white/10 text-[var(--color-ink-soft)]',
                                      )}
                                    >
                                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                                    </div>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                      <AvatarFallback className="text-xs">{initials(student.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold">{student.name}</p>
                                      <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                                        @{student.username}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  {isAbsent ? (
                                    <span className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">—</span>
                                  ) : (
                                    <span className="font-bold">
                                      {student.score} <span className="text-[var(--color-ink-soft)] font-normal">/ {student.maxScore}</span>
                                    </span>
                                  )}
                                </td>
                                <td className="p-4">
                                  {isAbsent || student.percentage === null ? (
                                    <span className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">—</span>
                                  ) : (
                                    <span
                                      className={cn(
                                        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold',
                                        student.percentage >= 90 && 'bg-emerald-100 text-emerald-700',
                                        student.percentage >= 70 && student.percentage < 90 && 'bg-blue-100 text-blue-700',
                                        student.percentage >= 50 && student.percentage < 70 && 'bg-amber-100 text-amber-700',
                                        student.percentage < 50 && 'bg-rose-100 text-rose-700',
                                      )}
                                    >
                                      <Percent className="h-3 w-3" /> {student.percentage}
                                    </span>
                                  )}
                                </td>
                                <td className="p-4">
                                  {student.parentPhone ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => sendWhatsApp(student, rank)}
                                      className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400 text-emerald-700"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" /> {isAbsent ? 'تنبيه غياب' : 'هنّئ ولي الأمر'}
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                                      لا يوجد رقم
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* Create exam dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>امتحان جديد — {grade}</DialogTitle>
            <DialogDescription>أضف اسم الامتحان والدرجة النهائية والتاريخ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم الامتحان</Label>
              <Input placeholder="مثال: اختبار الوحدة الأولى" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الدرجة النهائية</Label>
                <Input type="number" dir="ltr" placeholder="30" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
              </div>
              <div>
                <Label>تاريخ الامتحان</Label>
                <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'جاري الإنشاء...' : 'إنشاء الامتحان'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف امتحان "{deleteTarget?.title}"؟ هيتمسح كل الدرجات المسجّلة معاه.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              حذف نهائياً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scores entry dialog */}
      <Dialog open={!!scoresFor} onOpenChange={(o) => !o && setScoresFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{scoresFor?.title}</DialogTitle>
            <DialogDescription>الدرجة النهائية: {scoresFor?.maxScore} — اكتب درجة كل طالب واضغط Enter أو انقر خارج الحقل للحفظ</DialogDescription>
          </DialogHeader>
          {loadingScores ? (
            <div className="flex justify-center py-8">
              <div className="h-7 w-7 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scores.map((s) => {
                const pct = s.score !== null && scoresFor ? Math.round((s.score / scoresFor.maxScore) * 100) : null
                return (
                  <div key={s.studentId} className="flex items-center gap-3 rounded-xl bg-black/[0.02] dark:bg-white/5 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{s.name}</p>
                      {pct !== null && (
                        <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                          النسبة: {pct}%
                          {scoresFor && s.score !== null && s.score < scoresFor.maxScore && (
                            <> — ناقصة {scoresFor.maxScore - s.score}</>
                          )}
                        </p>
                      )}
                    </div>
                    <Input
                      type="number"
                      dir="ltr"
                      className="w-20 h-9 text-center"
                      value={s.score ?? ''}
                      onChange={(e) => handleScoreChange(s.studentId, e.target.value)}
                      onBlur={() => saveScore(s.studentId)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    />
                    {savingId === s.studentId && (
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-[var(--color-brand-500)]/30 border-t-[var(--color-brand-500)] animate-spin" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoresFor(null)}>
              تم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}