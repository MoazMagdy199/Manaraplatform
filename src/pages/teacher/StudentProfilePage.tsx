import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarCheck, Award, MessageCircle, AlertTriangle, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { initials } from '@/lib/utils'
import {
  fetchStudentProfileSummary,
  checkConsecutiveAbsences,
  type StudentProfileSummary,
} from '@/services/studentProfileService'

import { QRCodeCanvas } from 'qrcode.react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

  const downloadQRPdf = async () => {
    if (!student) return

    const textDiv = document.createElement('div')
    textDiv.style.position = 'absolute'
    textDiv.style.left = '-9999px'
    textDiv.style.top = '0'
    textDiv.style.background = 'white'
    textDiv.style.padding = '20px'
    textDiv.style.width = '400px'
    textDiv.style.textAlign = 'center'
    textDiv.style.fontFamily = 'Arial, sans-serif'
    textDiv.innerHTML = `
      <h2 style="font-size: 24px; margin: 0; color: #000;">${student.name}</h2>
      <p style="font-size: 16px; margin: 5px 0; color: #666;">${student.grade || ''}</p>
      <p style="font-size: 14px; margin: 0; color: #666;">@${student.username}</p>
    `
    document.body.appendChild(textDiv)

    try {
      const canvasText = await html2canvas(textDiv, { scale: 2 })
      const textImgData = canvasText.toDataURL('image/png')

      const qrCanvas = document.getElementById('student-qr-canvas') as HTMLCanvasElement
      const qrImgData = qrCanvas.toDataURL('image/png')

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 150]
      })

      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, 100, 150, 'F')
      
      // 👈 غيرنا لون الإطار للأزرق
      pdf.setDrawColor(29, 78, 216)
      pdf.setLineWidth(1)
      pdf.rect(5, 5, 90, 140)

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(14)
      // 👈 غيرنا لون النص للأزرق
      pdf.setTextColor(29, 78, 216)
      pdf.text("Mr. Hossam Abdulbaki", 50, 20, { align: "center" })
      
      pdf.addImage(qrImgData, 'PNG', 20, 35, 60, 60)
      pdf.addImage(textImgData, 'PNG', 10, 100, 80, 20)

      pdf.save(`QR_${student.username}.pdf`)
    } catch (error) {
      toast({ title: 'حدث خطأ في إنشاء الكارت', variant: 'error' })
    } finally {
      document.body.removeChild(textDiv)
    }
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
      `السلام عليكم، معاك سكرتيرة مستر حسام عبد الباقي.\n\n` +
      `حبيت أبلغك إن ${student.name} غاب حصتين متتاليتين.\n\n` +
      `ياريت تتابع معاه عشان ميفوّتش حصص مهمة.\n\n` +
      `شكرًا لدعمكم ومتابعتكم. 🌹\n\n` +
      `مع تحياتي،\nأ/ حسام عبد الباقي\nمدرس البرمجة`

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
                  id="student-qr-canvas"
                  value={student.username || student.id} 
                  size={140}
                  fgColor="#1d4ed8" // 👈 غيرنا لون الـ QR للأزرق
                />
              </div>
              <div className="flex-1 text-center sm:text-right">
                <h3 className="font-display font-bold text-lg mb-1">كود الحضور (QR)</h3>
                <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mb-4">
                  هذا الكود خاص بالطالب لتسجيل الحضور في السنتر عبر تطبيق الاسيستنت.
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
              {/* 👈 كروت الإحصائيات (حضور + متوسط امتحانات) */}
              <div className="grid sm:grid-cols-2 gap-4">
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