import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Printer, X, CheckCircle2, XCircle, FileText, CalendarDays, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase, extractSupabaseError } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'

interface ReportData {
  student_name: string
  student_grade: string
  attendance: {
    present_count?: number
    absent_count?: number
    absent_dates?: string[]
  }
  exams: {
    title: string
    score: number | null
    max_score: number
  }[]
  payment: {
    paid: boolean
    amount?: number | null
    paid_at?: string | null
  }
}

function currentMonthValue() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function StudentReportPage() {
  const { id } = useParams()
  const { toast } = useToast()
  
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const month = currentMonthValue()

  useEffect(() => {
    async function loadReport() {
      if (!id) return
      setLoading(true)
      try {
        const { data: report, error } = await supabase.rpc('get_student_full_report', {
          p_student_id: id,
          p_month: month
        })
        if (error) throw error
        setData(report as ReportData)
      } catch (err) {
        toast({ title: extractSupabaseError(err), variant: 'error' })
      } finally {
        setLoading(false)
      }
    }
    loadReport()
  }, [id, month, toast])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
      </div>
    )
  }

  if (!data) return <div className="text-center py-20">لا توجد بيانات لهذا الطالب.</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* أزرار التحكم - تختفي عند الطباعة */}
        <div className="flex items-center justify-between print:hidden">
          <Button variant="outline" onClick={() => window.close()}>
            <X className="h-4 w-4 ml-2" /> إغلاق الصفحة
          </Button>
          <Button onClick={() => window.print()} className="bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)]">
            <Printer className="h-4 w-4 ml-2" /> طباعة / حفظ PDF
          </Button>
        </div>

        {/* محتوى التقرير */}
        <div className="bg-white text-black p-8 rounded-2xl shadow-sm border print:shadow-none print:border-none print:p-0">
          {/* الهيدر */}
          <div className="text-center border-b pb-6 mb-6">
            <h1 className="text-3xl font-extrabold mb-2">تقرير متابعة الطالب</h1>
            <p className="text-gray-600 font-semibold">منصة منارة التعليمية</p>
            <p className="text-sm text-gray-500 mt-1">شهر: {month}</p>
          </div>

          {/* بيانات الطالب */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3 border-r-4 border-teal-600 pr-3">بيانات الطالب</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><span className="font-semibold text-gray-600">الاسم:</span> {data.student_name}</p>
              <p><span className="font-semibold text-gray-600">الصف:</span> {data.student_grade}</p>
            </div>
          </div>

          {/* الحضور والغياب */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3 border-r-4 border-teal-600 pr-3 flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> الحضور والغياب
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-sm text-green-700 font-semibold">أيام الحضور</p>
                <p className="text-2xl font-bold text-green-700">{data.attendance.present_count || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-sm text-red-700 font-semibold">أيام الغياب</p>
                <p className="text-2xl font-bold text-red-700">{data.attendance.absent_count || 0}</p>
              </div>
            </div>
            {data.attendance.absent_dates && data.attendance.absent_dates.length > 0 && (
              <div className="text-sm">
                <span className="font-semibold text-gray-600 block mb-2">تواريخ الغياب:</span>
                <div className="flex flex-wrap gap-2">
                  {data.attendance.absent_dates.map((date, idx) => (
                    <span key={idx} className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs border border-red-100">
                      {formatDate(date)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* الامتحانات */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3 border-r-4 border-teal-600 pr-3 flex items-center gap-2">
              <Award className="h-5 w-5" /> درجات الامتحانات
            </h2>
            {data.exams.length === 0 ? (
              <p className="text-sm text-gray-500">لم يسجل أي درجات امتحانات حتى الآن.</p>
            ) : (
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 border">اسم الامتحان</th>
                    <th className="p-3 border">الدرجة</th>
                    <th className="p-3 border">النسبة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.exams.map((exam, idx) => {
                    const pct = exam.score !== null ? Math.round((exam.score / exam.max_score) * 100) : 0
                    return (
                      <tr key={idx} className="border-b">
                        <td className="p-3 border">{exam.title}</td>
                        <td className="p-3 border font-semibold">{exam.score ?? '—'} / {exam.max_score}</td>
                        <td className="p-3 border">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${pct >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {exam.score !== null ? `${pct}%` : '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* الاشتراك */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3 border-r-4 border-teal-600 pr-3 flex items-center gap-2">
              <FileText className="h-5 w-5" /> حالة الاشتراك الشهري
            </h2>
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${data.payment.paid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {data.payment.paid ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <XCircle className="h-6 w-6 text-red-600" />}
              <div>
                <p className={`font-bold ${data.payment.paid ? 'text-green-700' : 'text-red-700'}`}>
                  {data.payment.paid ? 'تم سداد الاشتراك' : 'الاشتراك غير مسدد'}
                </p>
                {data.payment.paid && data.payment.amount && (
                  <p className="text-sm text-gray-600 mt-1">المبلغ: {data.payment.amount} ج.م</p>
                )}
                {data.payment.paid && data.payment.paid_at && (
                  <p className="text-sm text-gray-600">تاريخ الدفع: {formatDate(data.payment.paid_at)}</p>
                )}
              </div>
            </div>
          </div>

          {/* التوقيع */}
          <div className="mt-12 pt-6 border-t text-sm text-gray-500 text-center">
            <p>تم استخراج هذا التقرير آلياً من منصة منارة.</p>
            <p className="mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}