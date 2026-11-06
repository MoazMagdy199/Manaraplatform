import { useState, useEffect } from 'react'
import { Plus, Trash2, Sparkles, Users2, ClipboardPaste, Trophy, Eye, RotateCcw } from 'lucide-react'
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
import { useData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { formatDate } from '@/lib/utils'
import { fetchGroups, type Group } from '@/services/groupsService'
import { GRADES } from '@/lib/constants'
import type { Quiz, QuizQuestion, QuizResult } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { resetStudentQuizAttempt } from '@/services/quizzesService'

function newQuestion(): QuizQuestion {
  return {
    id: 'tmp-' + Math.random().toString(36).slice(2, 8),
    question: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    points: 5,
  }
}

export default function TeacherQuizzesPage() {
  const { quizzes, lessons, addQuiz, removeQuiz, quizResults, students, refetchAll } = useData()
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [lessonId, setLessonId] = useState('')
  const [duration, setDuration] = useState(15)
  const [isWeekly, setIsWeekly] = useState(false)
  
  const [grade, setGrade] = useState<string>(GRADES[0])
  const [groupId, setGroupId] = useState<string | null>(null)
  const [groups, setGroups] = useState<Group[]>([])

  const [questions, setQuestions] = useState<QuizQuestion[]>([newQuestion()])
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null)
  const [viewResults, setViewResults] = useState<Quiz | null>(null)

  const [selectedStudentResult, setSelectedStudentResult] = useState<QuizResult | null>(null)

  const [pasteDialogOpen, setPasteDialogOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')

  useEffect(() => {
    fetchGroups()
      .then((all) => setGroups(all.filter((g) => !g.grade || g.grade === grade)))
      .catch(() => setGroups([]))
    setGroupId(null)
  }, [grade])

  function openAdd() {
    setTitle('')
    setLessonId(lessons[0]?.id || '')
    setDuration(15)
    setIsWeekly(false)
    setGrade(GRADES[0])
    setGroupId(null)
    setQuestions([newQuestion()])
    setDialogOpen(true)
  }

  function updateQuestion(id: string, patch: Partial<QuizQuestion>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  }

  function handleProcessPaste() {
    if (!pasteText.trim()) return
    try {
      const blocks = pasteText.split('السؤال:').filter((b) => b.trim() !== '')
      const newQuestions: QuizQuestion[] = blocks.map((block) => {
        const lines = block.split('\n').map((l) => l.trim()).filter((l) => l !== '')
        const questionText = lines[0] || ''
        const a = lines.find((l) => l.startsWith('A)'))?.replace('A)', '').trim() || ''
        const b = lines.find((l) => l.startsWith('B)'))?.replace('B)', '').trim() || ''
        const c = lines.find((l) => l.startsWith('C)'))?.replace('C)', '').trim() || ''
        const d = lines.find((l) => l.startsWith('D)'))?.replace('D)', '').trim() || ''
        
        const answerLine = lines.find((l) => l.startsWith('الإجابة:'))
        const correctAnswer = (answerLine ? answerLine.replace('الإجابة:', '').trim().toUpperCase() : 'A') as 'A' | 'B' | 'C' | 'D'

        return {
          id: 'tmp-' + Math.random().toString(36).slice(2, 8),
          question: questionText,
          options: { A: a, B: b, C: c, D: d },
          correctAnswer: correctAnswer,
          points: 5,
        }
      })

      if (newQuestions.length > 0) {
        setQuestions((prev) => [...prev, ...newQuestions])
        toast({ title: `تم إضافة ${newQuestions.length} سؤال بنجاح`, variant: 'success' })
        setPasteDialogOpen(false)
        setPasteText('')
      } else {
        toast({ title: 'لم يتم العثور على أسئلة بالتنسيق الصحيح', variant: 'error' })
      }
    } catch {
      toast({ title: 'حدث خطأ أثناء قراءة النص', variant: 'error' })
    }
  }

  async function handleSave() {
    if (!title || (!isWeekly && !lessonId) || questions.some((q) => !q.question || Object.values(q.options).some((o) => !o))) {
      toast({ title: 'يرجى تعبئة جميع بيانات الاختبار والأسئلة', variant: 'error' })
      return
    }
    try {
      await addQuiz({ 
        title, 
        lessonId: isWeekly ? null : lessonId, 
        duration, 
        questions, 
        isWeekly,
        grade: isWeekly ? grade : null, 
        groupId: isWeekly ? groupId : null, 
      })
      toast({ title: isWeekly ? 'تم إنشاء الامتحان الأسبوعي بنجاح' : 'تم إنشاء الاختبار بنجاح', variant: 'success' })
      setDialogOpen(false)
    } catch {
      // error
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await removeQuiz(deleteTarget.id)
      toast({ title: `تم حذف اختبار "${deleteTarget.title}"`, variant: 'success' })
      setDeleteTarget(null)
    } catch {
      // error
    }
  }

  // 👈 دالة إعادة الامتحان
  async function handleResetQuiz(studentId: string, studentName: string) {
    if (!viewResults) return;
    if (!window.confirm(`هل أنت متأكد من إعادة الاختبار للطالب ${studentName}؟ سيتم مسح نتيجته الحالية.`)) return;
    
    try {
      await resetStudentQuizAttempt(viewResults.id, studentId);
      toast({ title: 'تم إعادة الاختبار للطالب بنجاح', variant: 'success' });
      await refetchAll();
    } catch (err) {
      toast({ title: 'حدث خطأ أثناء الإعادة', variant: 'error' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold">الاختبارات والامتحانات</h2>
          <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
            {quizzes.length} اختبار متاح للطلاب
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> إنشاء اختبار
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {quizzes.map((q) => {
          const results = quizResults.filter((r) => r.quizId === q.id)
          return (
            <Card key={q.id} className={q.isWeekly ? 'border-amber-400 shadow-md' : ''}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={q.isWeekly ? 'amber' : 'indigo'}>
                    {q.isWeekly ? 'امتحان شامل' : q.lessonTitle}
                  </Badge>
                  {q.isWeekly && (
                    <Badge variant="amber" className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" /> أسبوعي
                    </Badge>
                  )}
                </div>
                <h3 className="font-display font-bold">{q.title}</h3>
                <div className="flex items-center gap-4 text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-3">
                  <span>{q.questions.length} سؤال</span>
                  <span>{q.duration} دقيقة</span>
                  <span>{formatDate(q.createdAt)}</span>
                </div>
                <button
                  onClick={() => setViewResults(q)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)] mt-3 hover:underline"
                >
                  <Users2 className="h-3.5 w-3.5" /> عرض إحصائيات {results.length} طالب
                </button>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/5 dark:border-[var(--color-dark-border)]">
                  <Button size="sm" variant="ghost" className="hover:text-[var(--color-rose-500)] mr-auto" onClick={() => setDeleteTarget(q)}>
                    <Trash2 className="h-3.5 w-3.5" /> حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {quizzes.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="p-14 text-center text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
              <Sparkles className="h-10 w-10 mx-auto opacity-40 mb-3" />
              لا توجد اختبارات بعد
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create quiz dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء اختبار جديد</DialogTitle>
            <DialogDescription>أضف الأسئلة والاختيارات وحدد الإجابة الصحيحة لكل سؤال</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5">
            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setPasteDialogOpen(true)}
                className="text-[var(--color-brand-600)] border-[var(--color-brand-200)] bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-100)]"
              >
                <ClipboardPaste className="h-4 w-4 ml-2" />
                لصق الأسئلة بسرعة
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Label>عنوان الاختبار</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>المدة (دقيقة)</Label>
                <Input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              </div>
              
              {!isWeekly && (
                <div className="sm:col-span-3">
                  <Label>الحصة المرتبطة</Label>
                  <select
                    value={lessonId}
                    onChange={(e) => setLessonId(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm dark:bg-[var(--color-dark-surface-2)] dark:border-[var(--color-dark-border)]"
                  >
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <input
                type="checkbox"
                id="weekly-checkbox"
                checked={isWeekly}
                onChange={(e) => setIsWeekly(e.target.checked)}
                className="h-5 w-5 accent-amber-600 rounded cursor-pointer"
              />
              <Label htmlFor="weekly-checkbox" className="cursor-pointer font-semibold text-amber-800 dark:text-amber-400">
                هل هذا الامتحان الأسبوعي الشامل؟ (Weekly Exam)
              </Label>
            </div>

            {isWeekly && (
              <div className="grid sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
                <div>
                  <Label>الصف الدراسي</Label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as string)}
                    className="flex h-11 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm dark:bg-[var(--color-dark-surface-2)] dark:border-[var(--color-dark-border)]"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>المجموعة (اختياري)</Label>
                  <select
                    value={groupId || ''}
                    onChange={(e) => setGroupId(e.target.value || null)}
                    className="flex h-11 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm dark:bg-[var(--color-dark-surface-2)] dark:border-[var(--color-dark-border)]"
                  >
                    <option value="">كل المجموعات</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="rounded-xl border border-black/10 dark:border-[var(--color-dark-border)] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">السؤال {idx + 1}</p>
                    {questions.length > 1 && (
                      <button
                        onClick={() => setQuestions((prev) => prev.filter((x) => x.id !== q.id))}
                        className="text-[var(--color-rose-500)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Input placeholder="نص السؤال" value={q.question} onChange={(e) => updateQuestion(q.id, { question: e.target.value })} />
                  <div className="grid sm:grid-cols-2 gap-2">
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctAnswer === opt}
                          onChange={() => updateQuestion(q.id, { correctAnswer: opt })}
                          className="accent-[var(--color-brand-500)]"
                        />
                        <Input
                          placeholder={`اختيار ${opt}`}
                          value={q.options[opt]}
                          onChange={(e) => updateQuestion(q.id, { options: { ...q.options, [opt]: e.target.value } })}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 max-w-[140px]">
                    <Label className="mb-0 whitespace-nowrap text-xs">درجة السؤال</Label>
                    <Input type="number" min={1} value={q.points} onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) })} />
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={() => setQuestions((prev) => [...prev, newQuestion()])} className="w-full">
              <Plus className="h-4 w-4" /> إضافة سؤال
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>نشر الاختبار</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog لصق الأسئلة */}
      <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>لصق الأسئلة بسرعة</DialogTitle>
            <DialogDescription>
              الصق الأسئلة هنا. تأكد من استخدام التنسيق التالي:
              <br />
              <span className="text-xs font-mono bg-black/5 p-1 rounded mt-2 inline-block" dir="ltr">
                السؤال: ما هي عاصمة مصر؟<br />
                A) الإسكندرية<br />
                B) القاهرة<br />
                C) أسوان<br />
                D) طنطا<br />
                الإجابة: B
              </span>
            </DialogDescription>
          </DialogHeader>
          <div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full h-64 p-3 rounded-xl border border-black/10 dark:border-[var(--color-dark-border)] bg-transparent text-sm font-mono"
              placeholder="الصق الأسئلة هنا..."
              dir="rtl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleProcessPaste}>تأكيد وإضافة الأسئلة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف اختبار "{deleteTarget?.title}"؟</DialogDescription>
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

      {/* Results dialog - التقرير الشامل */}
      <Dialog open={!!viewResults} onOpenChange={(o) => !o && setViewResults(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">تقرير امتحان: {viewResults?.title}</DialogTitle>
            <DialogDescription>
              إحصائيات ودرجات الطلاب في هذا الاختبار
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const results = quizResults.filter((r) => r.quizId === viewResults?.id);
            
            if (results.length === 0) {
              return <p className="text-sm text-center text-[var(--color-ink-soft)] py-6">لم يقم أي طالب بحل هذا الاختبار بعد</p>;
            }

            const scores = results.map(r => r.score);
            const maxScore = results[0]?.maxScore || 0;
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            const highest = Math.max(...scores);
            const lowest = Math.min(...scores);

            const chartData = [
              { name: 'أعلى درجة', score: highest },
              { name: 'متوسط المجموعة', score: Number(avg.toFixed(1)) },
              { name: 'أقل درجة', score: lowest },
            ];

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-green-700 dark:text-green-400 font-semibold mb-1">أعلى درجة</p>
                      <p className="text-2xl font-bold text-green-800 dark:text-green-300">{highest} / {maxScore}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-blue-700 dark:text-blue-400 font-semibold mb-1">متوسط المجموعة</p>
                      <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{avg.toFixed(1)} / {maxScore}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-rose-50 dark:bg-rose-900/20 border-rose-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-rose-700 dark:text-rose-400 font-semibold mb-1">أقل درجة</p>
                      <p className="text-2xl font-bold text-rose-800 dark:text-rose-300">{lowest} / {maxScore}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-center mb-4">مقارنة المستويات</h3>
                    <div className="h-64 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} />
                          <YAxis domain={[0, maxScore]} />
                          <Tooltip cursor={{ fill: 'transparent' }} />
                          <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={60} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <h3 className="font-bold mb-3">درجات الطلاب (تنازلياً)</h3>
                  <div className="space-y-2">
                    {results.sort((a, b) => b.score - a.score).map((r, index) => {
                      const student = students.find((s) => s.id === r.studentId);
                      const percentage = (r.score / r.maxScore) * 100;
                      return (
                        <div key={r.id} className="flex items-center justify-between rounded-lg border border-black/5 dark:border-white/10 p-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${percentage >= 50 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                              {percentage.toFixed(0)}%
                            </div>
                            <div>
                              <p className="text-sm font-medium">{student?.name || 'طالب محذوف'}</p>
                              {index < 3 && <span className="text-xs text-amber-500 font-bold">🏆 من المتصدرين</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={percentage >= 50 ? 'success' : 'rose'}>
                              {r.score} / {r.maxScore}
                            </Badge>
                            <Button size="sm" variant="outline" onClick={() => setSelectedStudentResult(r)}>
                              <Eye className="h-4 w-4 ml-1" /> الإجابات
                            </Button>
                            {/* 👈 زرار إعادة الامتحان */}
                            <Button size="sm" variant="outline" className="text-amber-600 border-amber-600 hover:bg-amber-50" onClick={() => handleResetQuiz(r.studentId, student?.name || 'الطالب')}>
                              <RotateCcw className="h-4 w-4 ml-1" /> إعادة
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog مراجعة إجابات طالب معين */}
      <Dialog open={!!selectedStudentResult} onOpenChange={(o) => !o && setSelectedStudentResult(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>مراجعة إجابات الطالب: {students.find(s => s.id === selectedStudentResult?.studentId)?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {viewResults?.questions.map((q) => {
              const studentAnswer = selectedStudentResult?.answers[q.id];
              const isCorrect = studentAnswer === q.correctAnswer;
              
              return (
                <Card key={q.id} className={isCorrect ? 'border-green-200' : 'border-rose-200'}>
                  <CardContent className="p-4">
                    <p className="font-semibold mb-2">{q.question}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className={`p-2 rounded border ${isCorrect ? 'bg-green-50 border-green-200 text-green-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                        إجابة الطالب: {studentAnswer || 'لم يجب'}
                      </div>
                      <div className="p-2 rounded border bg-green-50 border-green-200 text-green-700">
                        الإجابة الصحيحة: {q.correctAnswer}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}