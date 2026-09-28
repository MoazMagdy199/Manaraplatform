import { useEffect, useState } from 'react'
import { Bell, BellOff, Smartphone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/context/ToastContext'
import {
  isPushSupported,
  isIos,
  isRunningStandalone,
  isSubscribedToPush,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push'

export function NotificationSettings() {
  const { toast } = useToast()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const supported = isPushSupported()
  const ios = isIos()
  const standalone = isRunningStandalone()
  const needsHomeScreenFirst = ios && !standalone

  useEffect(() => {
    isSubscribedToPush()
      .then(setSubscribed)
      .finally(() => setChecking(false))
  }, [])

  async function handleToggle() {
    setLoading(true)
    try {
      if (subscribed) {
        await unsubscribeFromPush()
        setSubscribed(false)
        toast({ title: 'تم إيقاف الإشعارات على هذا الجهاز', variant: 'info' })
      } else {
        const res = await subscribeToPush()
        if (res.ok) {
          setSubscribed(true)
          toast({ title: 'تم تفعيل الإشعارات بنجاح 🔔', variant: 'success' })
        } else {
          toast({ title: res.error || 'تعذّر تفعيل الإشعارات', variant: 'error' })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  if (!supported) {
    return (
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <BellOff className="h-5 w-5 text-[var(--color-ink-soft)]" />
            <h3 className="font-display font-bold text-lg">الإشعارات</h3>
          </div>
          <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
            المتصفح ده مش بيدعم الإشعارات الفورية.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-[var(--color-brand-500)]" />
          <h3 className="font-display font-bold text-lg">الإشعارات الفورية</h3>
        </div>

        {needsHomeScreenFirst && (
          <div className="rounded-xl bg-[var(--color-amber-100)] border border-[var(--color-amber-300)] p-4 mb-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-[var(--color-amber-600)] mb-2">
              <Smartphone className="h-4 w-4" /> على الآيفون: خطوة واحدة الأول
            </div>
            <ol className="list-decimal pr-5 space-y-1 text-[var(--color-ink)] dark:text-[var(--color-dark-ink)]">
              <li>افتح الموقع من Safari</li>
              <li>دوس على زر المشاركة (المربع وفوقه سهم)</li>
              <li>اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</li>
              <li>افتح الموقع من الأيقونة الجديدة اللي هتظهر، وارجع هنا تفعّل الإشعارات</li>
            </ol>
          </div>
        )}

        <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mb-4">
          فعّل الإشعارات عشان توصلك تنبيهات فورية للحصص والواجبات الجديدة، تصحيح الواجبات، والإعلانات — حتى لو الموقع مقفول.
        </p>

        <Button
          onClick={handleToggle}
          disabled={loading || checking || needsHomeScreenFirst}
          variant={subscribed ? 'outline' : 'default'}
        >
          {loading ? 'جاري التنفيذ...' : subscribed ? (
            <>
              <BellOff className="h-4 w-4" /> إيقاف الإشعارات على هذا الجهاز
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" /> تفعيل الإشعارات
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}