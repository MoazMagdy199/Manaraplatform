import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useToast } from '@/context/ToastContext'
import {
  isPushSupported,
  isIos,
  isRunningStandalone,
  isSubscribedToPush,
  isPushEnabledLocally,
  isBannerSnoozed,
  snoozeBanner,
  subscribeToPush,
} from '@/lib/push'

export function NotificationBanner() {
  const { toast } = useToast()
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  // مش عايزين نعرض البانر في صفحات معينة (زي تسجيل الدخول)
  const hiddenPaths = ['/login', '/']
  const shouldHideOnThisPage = hiddenPaths.includes(location.pathname)

  useEffect(() => {
    async function check() {
      // 1. لو المتصفح مش بيدعم → اخفي
      if (!isPushSupported()) return

      // 2. لو المستخدم فعّل الإشعارات محليًا → اخفي
      if (isPushEnabledLocally()) return

      // 3. لو المستخدم قفل البانر خلال آخر 3 أيام → اخفي
      if (isBannerSnoozed()) return

      // 4. لو المستخدم مشترك فعلاً في الإشعارات (بالفحص الفعلي) → اخفي
      const subscribed = await isSubscribedToPush()
      if (subscribed) return

      // 5. لو الصفحة الحالية مش المفروض يظهر فيها → اخفي
      if (shouldHideOnThisPage) return

      // كل الشروط اتوافرت → اعرض البانر
      setVisible(true)
    }

    check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  async function handleEnable() {
    setLoading(true)
    try {
      // لو آيفون ومش مضاف للشاشة الرئيسية
      if (isIos() && !isRunningStandalone()) {
        toast({
          title: 'افتح الموقع من الأيقونة على الشاشة الرئيسية',
          description: 'على الآيفون، لازم تضيف الموقع للشاشة الرئيسية الأول عشان تفعّل الإشعارات. الخطوات في صفحة الإعدادات.',
          variant: 'info',
        })
        setLoading(false)
        return
      }

      const res = await subscribeToPush()
      if (res.ok) {
        toast({ title: 'تم تفعيل الإشعارات بنجاح 🔔', variant: 'success' })
        setVisible(false)
      } else {
        toast({ title: res.error || 'تعذّر تفعيل الإشعارات', variant: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  function handleDismiss() {
    snoozeBanner()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50">
      <div className="rounded-2xl border border-black/10 dark:border-[var(--color-dark-border)] bg-white dark:bg-[var(--color-dark-surface)] shadow-2xl p-4 flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/40 flex items-center justify-center">
          <Bell className="h-5 w-5 text-[var(--color-brand-500)]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm mb-1">🔔 فعّل الإشعارات</p>
          <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mb-3">
            عشان توصلك الحصص والواجبات الجديدة فورًا، حتى لو الموقع مقفول.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleEnable} disabled={loading}>
              {loading ? 'جاري التفعيل...' : 'تفعيل الآن'}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              لاحقًا
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-[var(--color-ink-soft)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}