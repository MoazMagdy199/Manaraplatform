import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarCheck, ClipboardCheck, Sparkles, Award, Clock, History, MessageCircle, AlertTriangle, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { initials, formatDateTime } from '@/lib/utils'
import {
  fetchStudentProfileSummary,
  checkConsecutiveAbsences,
  type StudentProfileSummary,
} from '@/services/studentProfileService'

// 👈 استيراد مكتبات الـ QR والـ PDF
import { QRCodeCanvas } from 'qrcode.react'
import jsPDF from 'jspdf'

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'الآن'
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `منذ ${days} يوم`
  const months = Math.floor(days / 30)
  return `منذ ${months} شهر`
}

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { students } = useData()
  const { toast } = useToast()

  const student = students.find((s) => s.id === id)

  const [summary, setSummary] = useState<StudentProfileSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasConsecutiveAbsences, setHasConsecutiveAbsences] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      fetchStudentProfileSummary(id),
      checkConsecutiveAbsences(id),
    ])
      .then(([summaryData, absences]) => {
        setSummary(summaryData)
        setHasConsecutiveAbsences(absences)
      })
      .catch((err) => toast({ title: err instanceof Error ? err.message : 'تعذّر تحميل بيانات الطالب', variant: 'error' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // 👈 دالة تحميل كارت الـ QR
  const downloadQRPdf = () => {
    if (!student) return

    // 1. نعمل canvas للـ QR
    const qrCanvas = document.createElement('canvas')
    const qrCode = new QRCodeCanvas({
      value: student.username || student.id,
      size: 400, // حجم كبير عشان الجودة
      bgColor: "#ffffff",
      fgColor: "#000000",
      level: "H"
    })
    qrCanvas.appendChild(qrCode.canvas)
    const imgData = qrCode.canvas.toDataURL('image/png')

    // 2. نعمل ملف الـ PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150] // مقاس الكارت
    })

    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, 100, 150, 'F')
    
    // إطار الكارت
    pdf.setDrawColor(19, 78, 74) // لون المنصة
    pdf.setLineWidth(1)
    pdf.rect(5, 5, 90, 140)

    // اسم المنصة
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(16)
    pdf.setTextColor(19, 78, 74)
    pdf.text("Manara Platform", 50, 20, { align: "center" })
    
    // صورة الـ QR
    pdf.addImage(imgData, 'PNG', 20, 35, 60, 60)

    // بيانات الطالب
    pdf.setFontSize(14)
    pdf.setTextColor(0, 0, 0)
    pdf.text(student.name, 50, 110, { align: "center" })
    
    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    pdf.text(student.grade || '', 50, 117, { align: "center" })
    
    pdf.setFont("courier", "normal")
    pdf.text(`@${student.username}`, 50, 125, { align: "center" })

    pdf.save(`QR_${student.username}.pdf`)
  }

  function sendAbsenceWhatsApp() {
    if (!student?.parentPhone) {
      toast({ title: 'رقم ولي الأمر غير مسجل', variant: 'error' })
      return
    }

    const cleanPhone = student.parentPhone.replace(/\D/g, '')
    let fullPhone = cleanPhone
    if (!fullPhone.startsWith('20')) {
      fullPhone = fullPhone.startsWith('0') ? `20${fullPhone.slice(1)}` : `20${fullPhone}`
    }

    const message =
      `السلام عليكم، معاك سكرتيرة مستر معاذ مجدي.\n\n` +
      `حبيت أبلغك إن ${student.name} غاب حصتين متتاليتين.\n\n` +
      `ياريت تتابع معاه عشان ميفوّتش حصص مهمة.\n\n` +
      `شكرًا لدعمكم ومتابعتكم. 🌹\n\n` +
      `مع تحياتي،\nأ/ معاذ مجدي\nمدرس البرمجة`

    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  if (!student) {
    return (
      <div className="text-center py-20 text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
        الطالب غير موجود
      </div>
    )
  }

  const attTotal = summary ? summary.attendance.presentCount + summary.attendance.absentCount : 0
  const attPct = attTotal > 0 ? Math.round((summary!.attendance.presentCount / attTotal) * 100) : null

  return (
    <div className="space-y-6 max-w-3xl">
      <button
        type="button"
        onClick={() => navigate('/teacher/students')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-brand-600)] dark:text-[var(--color-dark-ink-soft)]"
      >
        <ArrowRight className="h-4 w-4" /> العودة لإدارة الطلاب
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={student.avatarUrl} alt={student.name} />
            <AvatarFallback className="text-lg">{initials(student.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-display text-2xl font-extrabold">{student.name}</h2>
            <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
              @{student.username} — {student.grade || 'بدون صف'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
        </div>
      ) : (
        <>
          {/* 👈 كارت الـ QR بتاع الطالب */}
          <Card className="border-[var(--color-brand-200)] bg-[var(--color-brand-50)]/30 dark:bg-[var(--color-brand-900)]/10 dark:border-[var(--color-brand-800)]">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-black/5">
                <QRCodeCanvas 
                  value={student.username || student.id} 
                  size={140}
                  fgColor="#134e4a"
                />
              </div>
              <div className="flex-1 text-center sm:text-right">
                <h3 className="font-display font-bold text-lg mb-1">كود الحضور (QR)</h3>
                <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mb-4">
                  هذا الكود خاص بالطالب لتسجيل الحضور في السنتر عبر تطبيق الأسطى.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <Button onClick={downloadQRPdf} variant="outline" className="bg-white dark:bg-transparent">
                    <Download className="h-4 w-4 ml-2" /> تحميل الكارت (PDF)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {summary ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-amber-100)] flex items-center justify-center mb-3">
                      <CalendarCheck className="h-4.5 w-4.5 text-[var(--color-amber-600)]" />
                    </div>
                    <p className="font-display text-2xl font-extrabold">{attPct !== null ? `${attPct}%` : '—'}</p>
                    <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">الحضور</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/40 flex items-center justify-center mb-3">
                      <ClipboardCheck className="h-4.5 w-4.5 text-[var(--color-brand-500)]" />
                    </div>
                    <p className="font-display text-2xl font-extrabold">
                      {summary.homework.submitted} / {summary.homework.total}
                    </p>
                    <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">الواجبات</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-indigo-300)]/25 flex items-center justify-center mb-3">
                      <Sparkles className="h-4.5 w-4.5 text-[var(--color-indigo-500)]" />
                    </div>
                    <p className="font-display text-2xl font-extrabold">
                      {summary.quiz.completed} / {summary.quiz.total}
                    </p>
                    <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">الاختبارات</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-rose-100)] flex items-center justify-center mb-3">
                      <Award className="h-4.5 w-4.5 text-[var(--color-rose-500)]" />
                    </div>
                    <p className="font-display text-2xl font-extrabold">
                      {summary.examAvg !== null ? `${summary.examAvg}%` : '—'}
                    </p>
                    <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                      متوسط الامتحانات
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                    <History className="h-5 w-5 text-[var(--color-brand-500)]" /> آخر نشاط
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-black/[0.02] dark:bg-white/5 p-3.5">
                      <Clock className="h-4 w-4 text-[var(--color-ink-soft)] shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">آخر دخول</p>
                        <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                          {summary.lastLogin ? `${timeAgo(summary.lastLogin)} (${formatDateTime(summary.lastLogin)})` : 'لم يسجّل دخول بعد'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-black/[0.02] dark:bg-white/5 p-3.5">
                      <Sparkles className="h-4 w-4 text-[var(--color-ink-soft)] shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">آخر اختبار</p>
                        <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                          {summary.lastQuiz
                            ? `${summary.lastQuiz.title} — ${timeAgo(summary.lastQuiz.submittedAt)}`
                            : 'لم يحلّ أي اختبار بعد'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {hasConsecutiveAbsences && student.parentPhone && (
                <Card className="border-rose-200 dark:border-rose-900/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5 text-rose-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-lg text-rose-700 dark:text-rose-400 mb-1">
                          تنبيه: غياب متتالي
                        </h3>
                        <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mb-4">
                          الطالب غاب حصتين متتاليتين. يُنصح بالتواصل مع ولي الأمر.
                        </p>
                        <Button
                          onClick={sendAbsenceWhatsApp}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          <MessageCircle className="h-4 w-4" /> إرسال تنبيه غياب لولي الأمر
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  )
}