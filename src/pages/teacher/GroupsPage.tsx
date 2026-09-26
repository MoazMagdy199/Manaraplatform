import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Layers } from 'lucide-react'
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
import { formatDate } from '@/lib/utils'
import { fetchGroups, createGroup, updateGroup, deleteGroup, type Group } from '@/services/groupsService'

const emptyForm = { name: '', grade: '' }

export default function GroupsPage() {
  const { toast } = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Group | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null)

  async function load() {
    setLoading(true)
    try {
      setGroups(await fetchGroups())
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر تحميل المجموعات', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(g: Group) {
    setEditing(g)
    setForm({ name: g.name, grade: g.grade || '' })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast({ title: 'يرجى كتابة اسم المجموعة', variant: 'error' })
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await updateGroup(editing.id, form.name.trim(), form.grade || undefined)
        toast({ title: 'تم تحديث المجموعة', variant: 'success' })
      } else {
        await createGroup(form.name.trim(), form.grade || undefined)
        toast({ title: 'تم إنشاء المجموعة', variant: 'success' })
      }
      setDialogOpen(false)
      load()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر الحفظ', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteGroup(deleteTarget.id)
      toast({ title: 'تم حذف المجموعة', variant: 'success' })
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'تعذّر الحذف', variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold">المجموعات</h2>
          <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
            نظّم طلابك وحصصك في مجموعات منفصلة (مفيد لما يكون عندك أكتر من دفعة في نفس الصف)
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> مجموعة جديدة
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="p-14 text-center text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
            <Layers className="h-10 w-10 mx-auto opacity-40 mb-3" />
            لسه مفيش مجموعات. أنشئ أول مجموعة، وبعدين اربط بيها الطلاب والحصص من صفحاتهم.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((g) => (
            <Card key={g.id}>
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-xl bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/40 flex items-center justify-center mb-3">
                  <Layers className="h-5 w-5 text-[var(--color-brand-500)]" />
                </div>
                <h3 className="font-display font-bold">{g.name}</h3>
                {g.grade && (
                  <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                    {g.grade}
                  </p>
                )}
                <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-3">
                  أُنشئت في {formatDate(g.createdAt)}
                </p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/5 dark:border-[var(--color-dark-border)]">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(g)}>
                    <Pencil className="h-3.5 w-3.5" /> تعديل
                  </Button>
                  <Button size="sm" variant="ghost" className="hover:text-[var(--color-rose-500)]" onClick={() => setDeleteTarget(g)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل المجموعة' : 'مجموعة جديدة'}</DialogTitle>
            <DialogDescription>مثال: "تانية ثانوي — المجموعة الجديدة"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم المجموعة</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>الصف الدراسي (اختياري، للتنظيم فقط)</Label>
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm dark:bg-[var(--color-dark-surface-2)] dark:border-[var(--color-dark-border)]"
              >
                <option value="">بدون تحديد</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف مجموعة "{deleteTarget?.name}"؟ الطلاب والحصص المرتبطين بيها هيرجعوا تلقائياً
              لمنطق "الصف الدراسي" العادي، مش هيتحذفوا.
            </DialogDescription>
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
