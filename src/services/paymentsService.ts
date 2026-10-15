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

/** يحدّث حالة دفع طالب واحد لشهر معيّن (للمدرس فقط - تنفيذ مباشر) */
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

// ========================================
// نظام الموافقة (للـ Assistant)
// ========================================

export interface PendingRequest {
  id: string
  requestedBy: string
  requestedByName: string
  requestType: string
  entityType: string
  entityId: string | null
  description: string
  payload: {
    studentId: string
    month: string
    paid: boolean
    amount: number | null
    notes: string | null
  }
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNotes: string | null
  createdAt: string
}

interface RawPendingRow {
  id: string
  requested_by: string
  requested_by_name: string
  request_type: string
  entity_type: string
  entity_id: string | null
  description: string
  payload: any
  status: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
}

function mapPending(r: RawPendingRow): PendingRequest {
  return {
    id: r.id,
    requestedBy: r.requested_by,
    requestedByName: r.requested_by_name,
    requestType: r.request_type,
    entityType: r.entity_type,
    entityId: r.entity_id,
    description: r.description,
    payload: r.payload,
    status: r.status as 'pending' | 'approved' | 'rejected',
    reviewedBy: r.reviewed_by,
    reviewedAt: r.reviewed_at,
    reviewNotes: r.review_notes,
    createdAt: r.created_at,
  }
}

/** Assistant تطلب تغيير في الدفع (بتتروح للموافقة) */
export async function requestPaymentChange(params: {
  studentId: string
  studentName: string
  month: string
  paid: boolean
  amount?: number | null
  notes?: string | null
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('يجب تسجيل الدخول')

  // هات اسم المستخدم
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const userName = profile?.name || user.email || 'مساعد'

  const actionLabel = params.paid ? 'تسجيل دفعة' : 'إلغاء دفعة'
  const description = `${actionLabel} للطالب ${params.studentName} - شهر ${params.month}`

  const { error } = await supabase.from('pending_requests').insert({
    requested_by: user.id,
    requested_by_name: userName,
    request_type: 'payment_update',
    entity_type: 'payment',
    entity_id: params.studentId,
    description,
    payload: {
      studentId: params.studentId,
      month: params.month,
      paid: params.paid,
      amount: params.amount ?? null,
      notes: params.notes ?? null,
    },
  })

  if (error) throw new Error(extractSupabaseError(error))
}

/** المدرس يشوف كل الطلبات المعلقة */
export async function fetchPendingRequests(): Promise<PendingRequest[]> {
  const { data, error } = await supabase
    .from('pending_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(extractSupabaseError(error))
  return (data as RawPendingRow[] | null || []).map(mapPending)
}

/** المدرس يوافق على طلب */
export async function approveRequest(requestId: string, reviewNotes?: string): Promise<void> {
  const { error } = await supabase.rpc('approve_pending_request', {
    p_request_id: requestId,
    p_review_notes: reviewNotes ?? null,
  })
  if (error) throw new Error(extractSupabaseError(error))
}

/** المدرس يرفض طلب */
export async function rejectRequest(requestId: string, reviewNotes?: string): Promise<void> {
  const { error } = await supabase.rpc('reject_pending_request', {
    p_request_id: requestId,
    p_review_notes: reviewNotes ?? null,
  })
  if (error) throw new Error(extractSupabaseError(error))
}