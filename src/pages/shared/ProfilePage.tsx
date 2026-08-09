import { useState, type FormEvent } from 'react'
import { Camera, Save, KeyRound } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { initials } from '@/lib/utils'

export default function ProfilePage() {
  const { user, updateProfile, changePassword, updateAvatar } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)

  if (!user) return null

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return

    setUploadingAvatar(true)
    const res = await updateAvatar(file)
    setUploadingAvatar(false)

    if (res.ok) {
      toast({ title: 'تم تحديث الصورة الشخصية بنجاح', variant: 'success' })
    } else {
      toast({ title: res.error || 'تعذّر رفع الصورة', variant: 'error' })
    }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast({ title: 'يرجى تعبئة جميع الحقول', variant: 'error' })
      return
    }
    setSavingProfile(true)
    const res = await updateProfile(name.trim(), email.trim(), phone.trim())
    setSavingProfile(false)
    if (res.ok) {
      toast({ title: 'تم حفظ التعديلات بنجاح', variant: 'success' })
    } else {
      toast({ title: res.error || 'تعذّر حفظ التعديلات', variant: 'error' })
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    if (!currentPwd || !newPwd) {
      toast({ title: 'يرجى تعبئة جميع الحقول', variant: 'error' })
      return
    }
    if (newPwd !== confirmPwd) {
      toast({ title: 'كلمتا المرور غير متطابقتين', variant: 'error' })
      return
    }
    if (newPwd.length < 6) {
      toast({ title: 'يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل', variant: 'error' })
      return
    }
    setSavingPwd(true)
    const res = await changePassword(currentPwd, newPwd)
    setSavingPwd(false)
    if (res.ok) {
      toast({ title: 'تم تغيير كلمة المرور بنجاح', variant: 'success' })
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } else {
      toast({ title: res.error || 'تعذّر تغيير كلمة المرور', variant: 'error' })
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">الملف الشخصي</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          إدارة بياناتك الشخصية
        </p>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-xl">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <label
                className="absolute -bottom-1 -left-1 h-7 w-7 rounded-full bg-[var(--color-brand-500)] text-white flex items-center justify-center shadow cursor-pointer hover:bg-[var(--color-brand-600)]"
                title="تغيير الصورة الشخصية"
              >
                {uploadingAvatar ? (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploadingAvatar}
                  onChange={handleAvatarSelect}
                />
              </label>
            </div>
            <div>
              <p className="font-display font-bold text-lg">{user.name}</p>
              <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                {user.role === 'Teacher' ? 'مدرس' : `طالب — ${user.grade}`}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <Label>الاسم الكامل</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={savingProfile}>
              <Save className="h-4 w-4" /> {savingProfile ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <h3 className="font-display font-bold text-lg mb-4">تغيير كلمة المرور</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label>كلمة المرور الحالية</Label>
              <Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>كلمة المرور الجديدة</Label>
                <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              </div>
              <div>
                <Label>تأكيد كلمة المرور</Label>
                <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
              </div>
            </div>
            <Button type="submit" variant="outline" disabled={savingPwd}>
              <KeyRound className="h-4 w-4" /> {savingPwd ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
