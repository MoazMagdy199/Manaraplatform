import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { fetchMyPaymentStatus } from '@/services/paymentsService'

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

function currentMonthValue() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function currentMonthLabel() {
  return MONTH_NAMES[new Date().getMonth()]
}

/**
 * بانر تذكير بسيط يظهر للطالب لو لسه ما دفعش اشتراك الشهر الحالي.
 * بيتحدد الشهر تلقائياً من تاريخ اليوم، فبيتجدد لوحده أول كل شهر
 * من غير أي إعداد إضافي — لا يحجب استخدام المنصة، مجرد تنبيه بصري.
 */
export function SubscriptionBanner() {
  const { user } = useAuth()
  const [paid, setPaid] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'Student') return

    fetchMyPaymentStatus(currentMonthValue())
      .then(setPaid)
      .catch(() => setPaid(null))
  }, [user])

  if (!user || user.role !== 'Student') return null

  // لا تظهر رسالة عدم الدفع قبل يوم 28 من الشهر
  const today = new Date().getDate()
  if (today < 28) return null

  if (paid === null || paid === true) return null

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-amber-100)] border border-[var(--color-amber-300)] p-4 mb-6">
      <AlertTriangle className="h-5 w-5 text-[var(--color-amber-600)] shrink-0" />
      <p className="text-sm font-semibold text-[var(--color-amber-600)]">
        اشتراك شهر {currentMonthLabel()} لسه متسددش. يرجى التواصل مع المدرس.
      </p>
    </div>
  )
}