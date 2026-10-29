import { useMemo, useState, useEffect } from 'react'
import { Search, Plus, Pencil, Trash2, KeyRound, GraduationCap, Layers, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { initials } from '@/lib/utils'
import { fetchGroups, type Group } from '@/services/groupsService'
import type { User } from '@/types'

const grades = ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي']

const emptyForm = {
  name: '',
  username: '',
  password: '',
  phone: '',
  email: '',
  grade: grades[0],
  groupId: null as string | null,
  parentName: '',
  parentPhone: '',
}

export default function StudentsPage() {
  const { students, addStudent, updateStudent, removeStudent, resetPassword } = useData()
  const { user } = useAuth()
  const { toast } = useToast()

  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [groups, setGroups] = useState<Group[]>([])

  const basePath = user?.role === 'Assistant' ? '/assistant' : '/teacher'

  useEffect(() => {
    fetchGroups()
      .then(setGroups)
      .catch(() => setGroups([]))
  }, [])

  const filtered = useMemo(
    () =>
      students.filter(
        (s) =>
          s.name.includes(query) || s.username.includes(query) || s.email.toLowerCase().includes(query.toLowerCase()),
      ),
    [students, query],
  )

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(s: User) {
    setEditing(s)
    setForm({
      name: s.name,
      username: s.username,
      password: '',
      phone: s.phone,
      email: s.email,
      grade: s.grade || grades[0],
      groupId: s.groupId || null,
      parentName: s.parentName || '',
      parentPhone: s.parentPhone || '',
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.username || !form.email) {
      toast({ title: 'يرجى تعبئة جميع الحقول المطلوبة', variant: 'error' })
      return
    }
    try {
      if (editing) {
        await updateStudent(editing.id, {
          name: form.name,
          username: form.username,
          email: form.email,
          phone: form.phone,
          grade: form.grade,
          groupId: form.groupId,
          parentName: form.parentName || null,
          parentPhone: form.parentPhone || null,
          newPassword: form.password || undefined,
        })
        toast({ title: 'تم تحديث بيانات الطالب بنجاح', variant: 'success' })
      } else {
        if (!form.password) {
          toast({ title: 'يرجى إدخال كلمة مرور للطالب الجديد', variant: 'error' })
          return
        }
        await addStudent({
          name: form.name,
          username: form.username,
          email: form.email,
          phone: form.phone,
          grade: form.grade,
          groupId: form.groupId,
          parentName: form.parentName || null,
          parentPhone: form.parentPhone || null,
          password: form.password,
        })
        toast({ title: 'تمت إضافة الطالب بنجاح', variant: 'success' })
      }
      setDialogOpen(false)
    } catch {
      // error toast already shown by DataContext
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await removeStudent(deleteTarget.id)
      toast({ title: `تم حذف الطالب ${deleteTarget.name}`, variant: 'success' })
      setDeleteTarget(null)
    } catch {
      // error toast already shown by DataContext
    }
  }

  async function handleReset(s: User) {
    try {
      const pwd = await resetPassword(s.id)
      toast({ title: `تم إعادة تعيين كلمة مرور ${s.name}`, description: `كلمة المرور الجديدة: ${pwd}`, variant: 'info' })
    } catch {
      // error toast already shown by DataContext
    }
  }

  function groupName(id?: string | null) {
    if (!id) return null
    return groups.find((g) => g.id === id)?.name || null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold">إدارة الطلاب</h2>
          <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
            {students.length} طالب مسجّل في المنصة
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> إضافة طالب
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-soft)]" />
        <Input placeholder="ابحث بالاسم، اسم المستخدم أو البريد..." value={query} onChange={(e) => setQuery(e.target.value)} className="pr-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 dark:border-[var(--color-dark-border)] text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                  <th className="text-right font-semibold p-4">الطالب</th>
                  <th className="text-right font-semibold p-4 hidden md:table-cell">الصف</th>
                  <th className="text-right font-semibold p-4 hidden xl:table-cell">المجموعة</th>
                  <th className="text-right font-semibold p-4 hidden lg:table-cell">البريد الإلكتروني</th>
                  <th className="text-right font-semibold p-4 hidden sm:table-cell">الهاتف</th>
                  <th className="text-right font-semibold p-4">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-black/5 dark:border-[var(--color-dark-border)] last:border-0 hover:bg-black/[0.015] dark:hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">{initials(s.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link to={`${basePath}/students/${s.id}`} className="font-semibold hover:text-[var(--color-brand-600)] hover:underline">{s.name}</Link>
                          <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                            @{s.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                      <span className="inline-flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" /> {s.grade}
                      </span>
                    </td>
                    <td className="p-4 hidden xl:table-cell text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                      {groupName(s.groupId) ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" /> {groupName(s.groupId)}
                        </span>
                      ) : (
                        <span className="text-xs opacity-50">—</span>
                      )}
                    </td>
                    <td className="p-4 hidden lg:table-cell text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">{s.email}</td>
                    <td className="p-4 hidden sm:table-cell text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]" dir="ltr">
                      {s.phone}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {/* 👈 زرار التقرير (بيفتح في تاب جديد) */}
                        <Button size="icon" variant="ghost" asChild title="تقرير شامل">
                          <Link to={`${basePath}/students/${s.id}/report`} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 text-emerald-600" />
                          </Link>
                        </Button>

                        <Button size="icon" variant="ghost" onClick={() => handleReset(s)} title="إعادة تعيين كلمة المرور">
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(s)} title="تعديل">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(s)} title="حذف" className="hover:text-[var(--color-rose-500)]">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                      لا توجد نتائج مطابقة للبحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</DialogTitle>
            <DialogDescription>يرجى تعبئة بيانات الطالب بشكل كامل</DialogDescription>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>الاسم الكامل</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>اسم المستخدم</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <Label>{editing ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <Label>رقم الهاتف</Label>
              <Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>الصف الدراسي</Label>
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm dark:bg-[var(--color-dark-surface-2)] dark:border-[var(--color-dark-border)]"
              >
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>المجموعة (اختياري — لو فاضي، الطالب يتبع الصف الدراسي العادي)</Label>
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

            <div className="sm:col-span-2 pt-2 border-t border-black/5 dark:border-[var(--color-dark-border)]">
              <p className="text-xs font-semibold text-[var(--color-brand-600)] mb-3">📱 بيانات ولي الأمر (اختياري)</p>
            </div>

            <div>
              <Label>اسم ولي الأمر</Label>
              <Input
                value={form.parentName}
                onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                placeholder="مثال: محمد أحمد"
              />
            </div>
            <div>
              <Label>رقم واتساب ولي الأمر</Label>
              <Input
                dir="ltr"
                value={form.parentPhone}
                onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                placeholder="01xxxxxxxxx"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>{editing ? 'حفظ التعديلات' : 'إضافة الطالب'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف الطالب "{deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
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