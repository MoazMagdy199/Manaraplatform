import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle2, Video, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/context/DataContext'
import { formatDate } from '@/lib/utils'

export default function StudentLessonsPage() {
  const { lessons } = useData()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">الحصص الدراسية</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          {lessons.length} حصة متاحة للمذاكرة
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {lessons.map((l) => (
          <Link key={l.id} to={`/student/lessons/${l.id}`}>
            <Card className="overflow-hidden h-full hover:-translate-y-0.5 transition-transform">
              <div className="h-36 bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/30 relative overflow-hidden">
                {l.imageUrl ? (
                  <img src={l.imageUrl} alt={l.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-[var(--color-brand-300)]" />
                  </div>
                )}
                {l.completedByStudent && (
                  <div className="absolute top-3 left-3 bg-white dark:bg-[var(--color-dark-surface)] rounded-full p-1 shadow">
                    <CheckCircle2 className="h-5 w-5 text-[var(--color-brand-500)]" />
                  </div>
                )}
              </div>
              <CardContent className="p-5">
                <h3 className="font-display font-bold leading-snug line-clamp-2">{l.title}</h3>
                <p className="text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1.5 line-clamp-2">
                  {l.description}
                </p>
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {l.videoUrl && (
                    <Badge variant="indigo">
                      <Video className="h-3 w-3" /> فيديو
                    </Badge>
                  )}
                  {l.pdfUrl && (
                    <Badge variant="rose">
                      <FileText className="h-3 w-3" /> PDF
                    </Badge>
                  )}
                  {l.completedByStudent && <Badge variant="success">تمت القراءة</Badge>}
                </div>
                <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-3">
                  {formatDate(l.createdAt)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
