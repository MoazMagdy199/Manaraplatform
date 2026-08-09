import { useState } from 'react'
import { Plus, Pencil, Trash2, Pin, Megaphone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { cn, formatDateTime } from '@/lib/utils'
import type { Announcement } from '@/types'

const emptyForm = { title: '', content: '', pinned: false }

export default function TeacherAnnouncementsPage() {
  const { announcements, addAnnouncement, updateAnnouncement, removeAnnouncement } = useData()
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)

  const sorted = [...announcements].sort((a, b) => Number(b.pinned) - Number(a.pinned))

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(a: Announcement) {
    setEditing(a)
    setForm({ title: a.title, content: a.content, pinned: a.pinned })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.title || !form.content) {
      toast({ title: 'يرجى تعبئة العنوان والمحتوى', variant: 'error' })
      return
    }
    try {
      if (editing) {
        await updateAnnouncement(editing.id, form)
        toast({ title: 'تم تحديث الإعلان', variant: 'success' })
      } else {
        await addAnnouncement(form)
        toast({ title: 'تم نشر الإعلان', variant: 'success' })
      }
      setDialogOpen(false)
    } catch {
      // error toast already shown by DataContext
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await removeAnnouncement(deleteTarget.id)
      toast({ title: 'تم حذف الإعلان', variant: 'success' })
      setDeleteTarget(null)
    } catch {
      // error toast already shown by DataContext
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold">الإعلانات</h2>
          <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
            تواصل مع طلابك بالمستجدات المهمة
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> إضافة إعلان
        </Button>
      </div>

      <div className="space-y-4">
        {sorted.map((a) => (
          <Card key={a.id} className={cn(a.pinned && 'ring-2 ring-[var(--color-amber-500)]/40')}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {a.pinned && <Pin className="h-4 w-4 text-[var(--color-amber-500)] shrink-0 mt-1" />}
                  <div>
                    <h3 className="font-display font-bold">{a.title}</h3>
                    <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1.5 leading-relaxed">
                      {a.content}
                    </p>
                    <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-3">
                      {formatDateTime(a.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(a)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="hover:text-[var(--color-rose-500)]" onClick={() => setDeleteTarget(a)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {sorted.length === 0 && (
          <Card>
            <CardContent className="p-14 text-center text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
              <Megaphone className="h-10 w-10 mx-auto opacity-40 mb-3" />
              لا توجد إعلانات بعد
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}</DialogTitle>
            <DialogDescription>سيظهر هذا الإعلان لجميع الطلاب فور النشر</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>عنوان الإعلان</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>محتوى الإعلان</Label>
              <Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/[0.02] dark:bg-white/5 p-3.5">
              <div>
                <Label className="mb-0">تثبيت الإعلان</Label>
                <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-0.5">
                  سيظهر في أعلى القائمة دائماً
                </p>
              </div>
              <Switch checked={form.pinned} onCheckedChange={(v) => setForm({ ...form, pinned: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>{editing ? 'حفظ التعديلات' : 'نشر الإعلان'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف هذا الإعلان؟</DialogDescription>
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
