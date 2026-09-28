import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

// مفاتيح localStorage
const STORAGE_PUSH_ENABLED = 'push_enabled'
const STORAGE_PROMPT_DISMISSED_AT = 'push_prompt_dismissed_at'
const DISMISS_DAYS = 3 // البانر يرجع بعد 3 أيام من قفله

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const view = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i)
  }
  return view
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function isRunningStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

// ==========================================
// دوال البانر (localStorage)
// ==========================================

/** هل الطالب فعّل الإشعارات خلاص؟ (البانر ميظهرش تاني) */
export function isPushEnabledLocally(): boolean {
  return localStorage.getItem(STORAGE_PUSH_ENABLED) === 'true'
}

export function markPushEnabledLocally(): void {
  localStorage.setItem(STORAGE_PUSH_ENABLED, 'true')
  localStorage.removeItem(STORAGE_PROMPT_DISMISSED_AT)
}

export function markPushDisabledLocally(): void {
  localStorage.removeItem(STORAGE_PUSH_ENABLED)
}

/** هل الطالب قفل البانر مؤخرًا (خلال آخر 3 أيام)؟ */
export function isBannerSnoozed(): boolean {
  const dismissedAt = localStorage.getItem(STORAGE_PROMPT_DISMISSED_AT)
  if (!dismissedAt) return false
  const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24)
  return daysSince < DISMISS_DAYS
}

/** لما الطالب يدوس ✕ على البانر */
export function snoozeBanner(): void {
  localStorage.setItem(STORAGE_PROMPT_DISMISSED_AT, String(Date.now()))
}

// ==========================================
// دوال الاشتراك
// ==========================================

export async function subscribeToPush(): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) return { ok: false, error: 'المتصفح ده مش بيدعم الإشعارات' }
  if (isIos() && !isRunningStandalone()) {
    return { ok: false, error: 'على الآيفون لازم تضيف الموقع للشاشة الرئيسية الأول (شرح في الأسفل)' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, error: 'لازم توافق على إذن الإشعارات من المتصفح' }
  }

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    // @ts-ignore - TS types mismatch between Uint8Array and BufferSource
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
  })

  const json = subscription.toJSON()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'يجب تسجيل الدخول' }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh,
      auth: json.keys!.auth,
    },
    { onConflict: 'endpoint' },
  )

  if (error) return { ok: false, error: error.message }

  // ✅ سجّل إن المستخدم فعّل الإشعارات (عشان البانر يختفي)
  markPushEnabledLocally()
  return { ok: true }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (subscription) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
    await subscription.unsubscribe()
  }
  // ✅ شيل علامة "مفعّل" (عشان البانر يرجع لو أراد)
  markPushDisabledLocally()
}

export async function isSubscribedToPush(): Promise<boolean> {
  if (!isPushSupported()) return false
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return false
  const subscription = await registration.pushManager.getSubscription()
  return !!subscription
}