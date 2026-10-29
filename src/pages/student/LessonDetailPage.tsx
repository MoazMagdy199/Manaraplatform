import { useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowRight, FileDown, CheckCircle2, Paperclip, Download, Lightbulb } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { formatDate } from '@/lib/utils'

export default function LessonDetailPage() {
  const { id } = useParams()
  const { lessons, markLessonRead } = useData()
  const { toast } = useToast()

  const [summaryOpen, setSummaryOpen] = useState(false) // 👈 حالة فتح النافذة

  const lesson = lessons.find((l) => l.id === id)
  if (!lesson) return <Navigate to="/student/lessons" replace />

  async function handleMarkRead() {
    try {
      await markLessonRead(lesson!.id)
      toast({ title: 'تم تحديد الحصة كمقروءة، أحسنت! 🎉', variant: 'success' })
    } catch {
      // error toast already shown by DataContext
    }
  }

  const youtubeEmbed = lesson.videoUrl
  const hasSummary = lesson.summary || (lesson.summaryImages && lesson.summaryImages.length > 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/student/lessons"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-brand-600)] dark:text-[var(--color-dark-ink-soft)]"
      >
        <ArrowRight className="h-4 w-4" /> العودة إلى الحصص
      </Link>

      {lesson.imageUrl && (
        <div className="rounded-2xl overflow-hidden h-56 sm:h-72">
          <img src={lesson.imageUrl} alt={lesson.title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{lesson.title}</h1>
          <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-2">
            {lesson.description}
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-2">
            نُشرت في {formatDate(lesson.createdAt)}
          </p>
        </div>

        {/* 👈 زرار فتح الملخص */}
        {hasSummary && (
          <Button 
            onClick={() => setSummaryOpen(true)} 
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white shadow-md"
          >
            <Lightbulb className="h-4 w-4 ml-2" />
            فتح الملخص السريع 💡
          </Button>
        )}
      </div>

      {youtubeEmbed && (
        <Card className="overflow-hidden">
          <div className="aspect-video bg-black">
            <iframe
              src={youtubeEmbed}
              title={lesson.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div
            className="prose-sm leading-loose [&_h3]:font-display [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pr-5"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        </CardContent>
      </Card>

      {lesson.pdfUrl && (
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-rose-100)] flex items-center justify-center">
                <FileDown className="h-5 w-5 text-[var(--color-rose-500)]" />
              </div>
              <div>
                <p className="font-semibold text-sm">ملف PDF للحصة</p>
                <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                  اضغط لتحميل الملف الكامل
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={lesson.pdfUrl} download>
                <Download className="h-4 w-4" /> تحميل
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {lesson.attachments.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <p className="font-semibold text-sm mb-3">مرفقات إضافية</p>
            <div className="space-y-2">
              {lesson.attachments.map((att) => (
                <a
                  key={att.name}
                  href={att.url}
                  className="flex items-center gap-2.5 rounded-xl bg-black/[0.02] dark:bg-white/5 p-3 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Paperclip className="h-4 w-4 text-[var(--color-ink-soft)]" />
                  {att.name}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center pb-8">
        {lesson.completedByStudent ? (
          <div className="flex items-center gap-2 text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)] font-semibold">
            <CheckCircle2 className="h-5 w-5" /> تم إنهاء قراءة هذه الحصة
          </div>
        ) : (
          <Button size="lg" onClick={handleMarkRead}>
            <CheckCircle2 className="h-4 w-4" /> تحديد الحصة كمقروءة
          </Button>
        )}
      </div>

      {/* 👈 نافذة الملخص والصور */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <Lightbulb className="h-5 w-5" />
              ملخص الحصة (الزتونة)
            </DialogTitle>
            <DialogDescription>
              {lesson.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {lesson.summary && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50">
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {lesson.summary}
                </p>
              </div>
            )}

            {lesson.summaryImages && lesson.summaryImages.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">صور إضافية:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {lesson.summaryImages.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={url} 
                        alt={`ملخص ${idx + 1}`} 
                        className="w-full h-32 object-cover rounded-xl border border-black/10 dark:border-white/10 hover:scale-105 transition-transform cursor-pointer" 
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}