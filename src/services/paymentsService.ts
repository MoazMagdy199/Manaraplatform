import { supabase, extractSupabaseError } from '@/lib/supabase'
import type { PaymentRow, PaymentsOverviewRow } from '@/types'

/** حالة اشتراك كل طلاب صف معيّن في شهر معيّن (بصيغة 'YYYY-MM') */
export async function fetchPaymentsForMonth(grade: string, month: string): Promise<PaymentRow[]> {
  const { data, error } = await supabase.rpc('get_payments_for_month', { p_grade: grade, p_month: month })
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []).map((r: any) => ({
    studentId: r.student_id,
    name: r.name,
    username: r.username,
    paid: r.paid,
    amount: r.amount,
    paidAt: r.paid_at,
    notes: r.notes,
  }))
}

/** يحدّث حالة دفع طالب واحد لشهر معيّن */
export async function setPaymentStatus(
  studentId: string,
  month: string,
  paid: boolean,
  amount?: number | null,
  notes?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('set_payment_status', {
    p_student_id: studentId,
    p_month: month,
    p_paid: paid,
    p_amount: amount ?? null,
    p_notes: notes ?? null,
  })
  if (error) throw new Error(extractSupabaseError(error))
}

/** ملخص سريع: كام طالب دفع من إجمالي كام لكل صف، في شهر معيّن */
export async function fetchPaymentsOverview(month: string): Promise<PaymentsOverviewRow[]> {
  const { data, error } = await supabase.rpc('get_payments_overview', { p_month: month })
  if (error) throw new Error(extractSupabaseError(error))
  return (data || []).map((r: any) => ({
    grade: r.grade,
    totalStudents: Number(r.total_students),
    paidStudents: Number(r.paid_students),
  }))
}
export async function fetchMyPaymentStatus(month: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('payments')
    .select('paid')
    .eq('student_id', user.id)
    .eq('month', month)
    .maybeSingle()

  if (error) throw new Error(extractSupabaseError(error))
  return data?.paid ?? false
}