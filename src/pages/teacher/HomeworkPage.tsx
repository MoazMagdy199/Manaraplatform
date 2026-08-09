import { useState } from 'react'
import { Plus, Pencil, Trash2, ClipboardCheck, FileDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import { formatDate, formatDateTime } from '@/lib/utils'
import type { Homework, HomeworkSubmission } from '@/types'

const emptyForm = { lessonId: '', title: '', description: '', deadline: '', maxGrade: 10 }

export default function TeacherHomeworkPage() {
  const { homework, lessons, addHomework, updateHomework, removeHomework, submissions, gradeSubmission } = useData()
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Homework | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Homework | null>(null)
  const [grading, setGrading] = useState<HomeworkSubmission | null>(null)
  const [gradeVal, setGradeVal] = useState('')
  const [feedbackVal, setFeedbackVal] = useState('')

  function openAdd() {
    setEditing(null)
    setForm({ ...emptyForm, lessonId: lessons[0]?.id || '' })
    setDialogOpen(true)
  }

  function openEdit(h: Homework) {
    setEditing(h)
    setForm({ lessonId: h.lessonId, title: h.title, description: h.description, deadline: h.deadline, maxGrade: h.maxGrade })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.title || !form.lessonId || !form.deadline) {
      toast({ title: 'يرجى تعبئة جميع الحقول', variant: 'error' })
      return
    }
    try {
      if (editing) {
        await updateHomework(editing.id, form)
        toast({ title: 'تم تحديث الواجب بنجاح', variant: 'success' })
      } else {
        await addHomework(form)
        toast({ title: 'تمت إضافة الواجب بنجاح', variant: 'success' })
      }
      setDialogOpen(false)
    } catch {
      // error toast already shown by DataContext
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await removeHomework(deleteTarget.id)
      toast({ title: `تم حذف واجب "${deleteTarget.title}"`, variant: 'success' })
      setDeleteTarget(null)
    } catch {
      // error toast already shown by DataContext
    }
  }

  function openGrading(s: HomeworkSubmission) {
    setGrading(s)
    setGradeVal(s.grade?.toString() || '')
    setFeedbackVal(s.feedback || '')
  }

  async function saveGrade() {
    if (!grading) return
    const g = Number(gradeVal)
    if (isNaN(g) || g < 0 || g > grading.maxGrade) {
      toast({ title: `الدرجة يجب أن تكون بين 0 و ${grading.maxGrade}`, variant: 'error' })
      return
    }
    try {
      await gradeSubmission(grading.id, g, feedbackVal)
      toast({ title: 'تم حفظ الدرجة والملاحظات', variant: 'success' })
      setGrading(null)
    } catch {
      // error toast already shown by DataContext
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">الواجبات</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          إدارة الواجبات وتصحيح إجابات الطلاب
        </p>
      </div>

      <Tabs defaultValue="manage">
        <TabsList>
          <TabsTrigger value="manage">إدارة الواجبات</TabsTrigger>
          <TabsTrigger value="review">تصحيح الحلول ({submissions.filter((s) => s.status === 'pending').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <div className="flex justify-end mb-4">
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" /> إضافة واجب
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {homework.map((h) => (
              <Card key={h.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="indigo" className="mb-2">
                        {h.lessonTitle}
                      </Badge>
                      <h3 className="font-display font-bold">{h.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-2 line-clamp-2">
                    {h.description}
                  </p>
                  <p className="text-xs mt-3 font-semibold text-[var(--color-rose-500)]">
                    آخر موعد للتسليم: {formatDate(h.deadline)}
                  </p>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/5 dark:border-[var(--color-dark-border)]">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(h)}>
                      <Pencil className="h-3.5 w-3.5" /> تعديل
                    </Button>
                    <Button size="sm" variant="ghost" className="hover:text-[var(--color-rose-500)]" onClick={() => setDeleteTarget(h)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="review">
          <div className="space-y-3">
            {submissions.length === 0 && (
              <Card>
                <CardContent className="p-14 text-center text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                  <ClipboardCheck className="h-10 w-10 mx-auto opacity-40 mb-3" />
                  لا توجد تسليمات بعد
                </CardContent>
              </Card>
            )}
            {submissions.map((s) => {
              const hw = homework.find((h) => h.id === s.homeworkId)
              return (
                <Card key={s.id}>
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{s.studentName}</p>
                        {s.status === 'graded' ? (
                          <Badge variant="success">تم التصحيح: {s.grade}/{s.maxGrade}</Badge>
                        ) : (
                          <Badge variant="amber">بانتظار التصحيح</Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                        {hw?.title} — سُلّم في {formatDateTime(s.submittedAt)}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => openGrading(s)}>
                      {s.status === 'graded' ? 'مراجعة التصحيح' : 'تصحيح الحل'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit homework dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل الواجب' : 'إضافة واجب جديد'}</DialogTitle>
            <DialogDescription>اربط الواجب بحصة وحدد موعد التسليم</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الحصة المرتبطة</Label>
              <select
                value={form.lessonId}
                onChange={(e) => setForm({ ...form, lessonId: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm dark:bg-[var(--color-dark-surface-2)] dark:border-[var(--color-dark-border)]"
              >
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>عنوان الواجب</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>السؤال / الوصف</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>موعد التسليم</Label>
              <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>{editing ? 'حفظ التعديلات' : 'إضافة الواجب'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف واجب "{deleteTarget?.title}"؟</DialogDescription>
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

      {/* Grading dialog */}
      <Dialog open={!!grading} onOpenChange={(o) => !o && setGrading(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تصحيح حل {grading?.studentName}</DialogTitle>
          </DialogHeader>
          {grading && (
            <div className="space-y-4">
              <div className="rounded-xl bg-black/[0.02] dark:bg-white/5 p-4 text-sm leading-relaxed">
                {grading.answer}
              </div>
              {grading.fileUrls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                    {grading.fileUrls.length > 1 ? `${grading.fileUrls.length} ملفات مرفقة من الطالب` : 'ملف مرفق من الطالب'}
                  </p>
                  {grading.fileUrls.map((url, i) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)] rounded-xl bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/30 p-3 hover:underline w-fit"
                    >
                      <FileDown className="h-4 w-4" />
                      {grading.fileUrls.length > 1 ? `فتح / تحميل الملف رقم ${i + 1}` : 'فتح / تحميل ملف الطالب المرفق'}
                    </a>
                  ))}
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>الدرجة (من {grading.maxGrade})</Label>
                  <Input type="number" min={0} max={grading.maxGrade} value={gradeVal} onChange={(e) => setGradeVal(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>ملاحظات للطالب</Label>
                <Textarea rows={3} value={feedbackVal} onChange={(e) => setFeedbackVal(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrading(null)}>
              إلغاء
            </Button>
            <Button onClick={saveGrade}>حفظ الدرجة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
