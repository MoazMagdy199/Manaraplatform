import { useEffect, useState } from 'react'
import { Plus, Trash2, Award, Users, ClipboardList } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { formatDate } from '@/lib/utils'
import {
  fetchExamsForGrade,
  createExam,
  deleteExam,
  fetchExamScores,
  setExamScore,
  type Exam,
  type ExamScoreRow,
} from '@/services/examsService'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function GradesPage() {
  const { toast } = useToast()

  const [grade, setGrade] = useState<string>(GRADES[0])
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

  async function loadExams() {
    setLoading(true)
    try {
      const data = await fetchExamsForGrade(grade)
      setExams(data)
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر تحميل الامتحانات', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade])

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
      loadExams() // يحدّث عدد المصحَّحين في الكارت
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر حفظ الدرجة', variant: 'error' })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold">الامتحانات والدرجات</h2>
          <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
            أنشئ امتحان وسجّل درجات الطلاب
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> امتحان جديد
          </Button>
        </div>
      </div>

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
