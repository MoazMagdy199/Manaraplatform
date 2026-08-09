import { useState } from 'react'
import { ClipboardCheck, Clock, CheckCircle2, Upload, Star, X, Paperclip } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { formatDate } from '@/lib/utils'
import { uploadFiles } from '@/services/filesService'
import { extractSupabaseErrorMessage } from '@/lib/supabase'
import type { Homework } from '@/types'

const MAX_FILES = 5

export default function StudentHomeworkPage() {
  const { user } = useAuth()
  const { homework, submissions, submitHomework } = useData()
  const { toast } = useToast()

  const [target, setTarget] = useState<Homework | null>(null)
  const [answer, setAnswer] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const mySubmissions = submissions.filter((s) => s.studentId === user?.id)

  function getSubmission(homeworkId: string) {
    return mySubmissions.find((s) => s.homeworkId === homeworkId)
  }

  function openSubmit(h: Homework) {
    setTarget(h)
    setAnswer('')
    setSelectedFiles([])
  }

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const incoming = Array.from(newFiles)
    setSelectedFiles((prev) => {
      const combined = [...prev, ...incoming]
      if (combined.length > MAX_FILES) {
        toast({ title: `الحد الأقصى ${MAX_FILES} ملفات لكل تسليم`, variant: 'error' })
        return combined.slice(0, MAX_FILES)
      }
      return combined
    })
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!target || !user) return
    if (!answer.trim()) {
      toast({ title: 'يرجى كتابة إجابتك قبل الإرسال', variant: 'error' })
      return
    }
    try {
      let fileUrls: string[] = []
      if (selectedFiles.length > 0) {
        setUploading(true)
        try {
          fileUrls = await uploadFiles(selectedFiles)
        } catch (err) {
          toast({ title: extractSupabaseErrorMessage(err, 'تعذّر رفع الملفات'), variant: 'error' })
          return
        } finally {
          setUploading(false)
        }
      }

      await submitHomework({
        homeworkId: target.id,
        answer,
        fileUrls,
      })
      toast({ title: 'تم إرسال الواجب بنجاح', description: 'سيقوم المدرس بتصحيحه قريباً', variant: 'success' })
      setTarget(null)
    } catch {
      // error toast already shown by DataContext
    }
  }

  const isOverdue = (deadline: string) => new Date(deadline) < new Date()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">الواجبات</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          {homework.length} واجب مطلوب إنجازه
        </p>
      </div>

      <div className="space-y-4">
        {homework.map((h) => {
          const sub = getSubmission(h.id)
          const overdue = isOverdue(h.deadline) && !sub
          return (
            <Card key={h.id}>
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-[var(--color-amber-100)] flex items-center justify-center shrink-0">
                    <ClipboardCheck className="h-5 w-5 text-[var(--color-amber-600)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold">{h.title}</p>
                    <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 line-clamp-2">
                      {h.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> يُسلَّم قبل {formatDate(h.deadline)}
                      </span>
                      {sub?.status === 'graded' && (
                        <Badge variant="success">
                          <Star className="h-3 w-3" /> {sub.grade}/{sub.maxGrade}
                        </Badge>
                      )}
                      {sub?.status === 'pending' && <Badge variant="amber">بانتظار التصحيح</Badge>}
                      {overdue && <Badge variant="rose">انتهى الموعد</Badge>}
                    </div>
                  </div>
                </div>
                {sub ? (
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)] shrink-0">
                    <CheckCircle2 className="h-4 w-4" /> تم التسليم
                  </div>
                ) : (
                  <Button size="sm" onClick={() => openSubmit(h)} className="shrink-0">
                    <Upload className="h-4 w-4" /> تسليم الواجب
                  </Button>
                )}
              </CardContent>
              {sub?.feedback && (
                <CardContent className="p-5 pt-0">
                  <div className="rounded-xl bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/30 p-3.5 text-sm">
                    <p className="font-semibold text-[var(--color-brand-700)] dark:text-[var(--color-brand-300)] mb-1">
                      ملاحظات المدرس:
                    </p>
                    <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">{sub.feedback}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{target?.title}</DialogTitle>
            <DialogDescription>{target?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>إجابتك</Label>
              <Textarea rows={6} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="اكتب إجابتك هنا بالتفصيل..." />
            </div>
            <div>
              <Label>إرفاق ملفات (صور أو PDF، حتى {MAX_FILES} ملفات، 15 ميجابايت لكل ملف)</Label>
              <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/15 dark:border-white/15 p-5 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/5 text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                <Upload className="h-4 w-4" />
                {selectedFiles.length > 0 ? `أضف المزيد (${selectedFiles.length}/${MAX_FILES})` : 'اضغط لاختيار ملف أو أكثر'}
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = '' // allow re-selecting the same file name later
                  }}
                />
              </label>

              {selectedFiles.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {selectedFiles.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-2 rounded-lg bg-black/[0.03] dark:bg-white/5 px-3 py-2 text-sm"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-[var(--color-ink-soft)] shrink-0" />
                      <span className="flex-1 truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-[var(--color-ink-soft)] hover:text-[var(--color-rose-500)] shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={uploading}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={uploading}>
              {uploading ? 'جاري رفع الملفات...' : 'إرسال الواجب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
