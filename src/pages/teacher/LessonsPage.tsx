import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Video, FileText, Image as ImageIcon, Paperclip, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { RichTextEditor } from '@/components/shared/RichTextEditor'
import { useData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { formatDate } from '@/lib/utils'
import { fetchGroups, type Group } from '@/services/groupsService'
import type { Lesson } from '@/types'

const emptyForm = { 
  title: '', 
  description: '', 
  content: '', 
  summary: '', // 👈 تمت الإضافة
  grade: '', 
  groupId: null as string | null, 
  pdfUrl: '', 
  videoUrl: '', 
  imageUrl: '' 
}

export default function TeacherLessonsPage() {
  const { lessons, addLesson, updateLesson, removeLesson } = useData()
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Lesson | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null)
  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    fetchGroups()
      .then(setGroups)
      .catch(() => setGroups([]))
  }, [])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(l: Lesson) {
    setEditing(l)
    setForm({
      title: l.title,
      description: l.description,
      content: l.content,
      summary: l.summary || '', // 👈 تمت الإضافة
      grade: l.grade || '',
      groupId: l.groupId || null,
      pdfUrl: l.pdfUrl || '',
      videoUrl: l.videoUrl || '',
      imageUrl: l.imageUrl || '',
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.title || !form.description) {
      toast({ title: 'يرجى تعبئة العنوان والوصف على الأقل', variant: 'error' })
      return
    }
    try {
      if (editing) {
        await updateLesson(editing.id, form)
        toast({ title: 'تم تحديث الحصة بنجاح', variant: 'success' })
      } else {
        await addLesson(form)
        toast({ title: 'تمت إضافة الحصة بنجاح', variant: 'success' })
      }
      setDialogOpen(false)
    } catch {
      // error toast already shown by DataContext
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await removeLesson(deleteTarget.id)
      toast({ title: `تم حذف حصة "${deleteTarget.title}"`, variant: 'success' })
      setDeleteTarget(null)
    } catch {
      // error toast already shown by DataContext
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold">الحصص الدراسية</h2>
          <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
            {lessons.length} حصة منشورة على المنصة
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> إضافة حصة
        </Button>
      </div>

      {lessons.length === 0 ? (
        <EmptyState onAdd={openAdd} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lessons.map((l) => (
            <Card key={l.id} className="overflow-hidden flex flex-col">
              {l.imageUrl && (
                <div className="h-36 overflow-hidden">
                  <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-5 flex flex-col flex-1">
                <h3 className="font-display font-bold text-lg leading-snug">{l.title}</h3>
                <span className="inline-flex w-fit mt-2 rounded-full bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/40 px-2.5 py-1 text-xs font-semibold text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]">
  {l.grade || 'كل الصفوف'}
</span>
                <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1.5 line-clamp-2 flex-1">
                  {l.description}
                </p>
                <div className="flex items-center gap-3 mt-4 text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                  {l.videoUrl && <Video className="h-4 w-4" />}
                  {l.pdfUrl && <FileText className="h-4 w-4" />}
                  {l.imageUrl && <ImageIcon className="h-4 w-4" />}
                  {l.attachments.length > 0 && <Paperclip className="h-4 w-4" />}
                  <span className="text-xs mr-auto">{formatDate(l.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/5 dark:border-[var(--color-dark-border)]">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(l)}>
                    <Pencil className="h-3.5 w-3.5" /> تعديل
                  </Button>
                  <Button size="sm" variant="ghost" className="hover:text-[var(--color-rose-500)]" onClick={() => setDeleteTarget(l)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل الحصة' : 'إضافة حصة جديدة'}</DialogTitle>
            <DialogDescription>أضف تفاصيل الحصة والمرفقات التعليمية</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>عنوان الحصة</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>وصف مختصر</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            {/* 👈 بداية حقل الملخص الجديد */}
            <div>
              <Label>ملخص سريع (Cheat Sheet) - اختياري</Label>
              <Textarea 
                rows={3} 
                placeholder="أهم النقاط، القوانين، أو الزتونة اللي الطالب يراجعها قبل الامتحان..." 
                value={form.summary} 
                onChange={(e) => setForm({ ...form, summary: e.target.value })} 
              />
            </div>
            {/* 👈 نهاية حقل الملخص الجديد */}

            <div>
              <Label>الصف الدراسي</Label>
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">كل الصفوف</option>
                <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
              </select>
            </div>
            <div>
              <Label>المجموعة (اختياري — لو فاضي، الحصة تتبع الصف الدراسي العادي)</Label>
              <select
                value={form.groupId || ''}
                onChange={(e) => setForm({ ...form, groupId: e.target.value || null })}
                className="flex h-11 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm dark:bg-[var(--color-dark-surface-2)] dark:border-[var(--color-dark-border)]"
              >
                <option value="">بدون مجموعة (يتبع الصف)</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>الشرح الكامل</Label>
              <RichTextEditor value={form.content} onChange={(html) => setForm({ ...form, content: html })} placeholder="اكتب شرح الحصة بالتفصيل..." />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>رابط الصورة</Label>
                <Input dir="ltr" placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </div>
              <div>
                <Label>رابط فيديو YouTube</Label>
                <Input dir="ltr" placeholder="https://youtube.com/embed/..." value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
              </div>
              <div>
                <Label>رابط ملف PDF</Label>
                <Input dir="ltr" placeholder="https://..." value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>{editing ? 'حفظ التعديلات' : 'نشر الحصة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف حصة "{deleteTarget?.title}"؟</DialogDescription>
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
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card>
      <CardContent className="p-14 text-center">
        <BookOpen className="h-10 w-10 mx-auto text-[var(--color-ink-soft)]/40" />
        <p className="mt-4 font-semibold">لا توجد حصص بعد</p>
        <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
          ابدأ بإضافة أول حصة دراسية لطلابك
        </p>
        <Button className="mt-5" onClick={onAdd}>
          <Plus className="h-4 w-4" /> إضافة حصة
        </Button>
      </CardContent>
    </Card>
  )
}