import { useState, useEffect, useMemo } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, XCircle, Trophy, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

// دالة خلط عشوائي (Shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function QuizTakePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { quizzes, quizResults, submitQuiz, refetchAll } = useData()
  const { toast } = useToast()

  const quiz = quizzes.find((q) => q.id === id)
  const existingResult = quizResults.find((r) => r.quizId === id && r.studentId === user?.id)

  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({})
  const [submitted, setSubmitted] = useState(false)
  const [localResult, setLocalResult] = useState<{ score: number; maxScore: number } | null>(null)
  
  // ⏱️ حالة الوقت
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // 🎲 خلط الأسئلة والاختيارات (مرة واحدة عند فتح الصفحة)
  const shuffledQuestions = useMemo(() => {
    if (!quiz) return []
    return quiz.questions.map((q) => ({
      ...q,
      options: shuffleArray(Object.entries(q.options)) // بنخلط الاختيارات
    }))
  }, [quiz])

  // ⏱️ تشغيل العداد التنازلي
  useEffect(() => {
    if (!quiz || existingResult || submitted) return

    // المدة بالدقايق -> ثواني
    const totalSeconds = quiz.duration * 60
    setTimeLeft(totalSeconds)

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quiz, existingResult, submitted])

  // ⏱️ لما الوقت يخلص، نسلم تلقائي
  useEffect(() => {
    if (timeLeft === 0 && !submitted && !existingResult) {
      handleAutoSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  if (!quiz) return <Navigate to="/student/quizzes" replace />

  const reviewMode = !!existingResult || submitted
  const displayAnswers = existingResult?.answers || answers

  function handleSelect(qId: string, opt: string) {
    if (reviewMode) return
    setAnswers((prev) => ({ ...prev, [qId]: opt as 'A' | 'B' | 'C' | 'D' }))
  }

  async function handleAutoSubmit() {
    // لو الوقت خلص، بنسلم اللي الطالب حله (حتى لو مكملش)
    if (!user || !quiz) return
    try {
      const result = await submitQuiz(quiz.id, answers)
      setLocalResult({ score: result.score, maxScore: result.maxScore })
      setSubmitted(true)
      toast({ title: 'انتهى الوقت! تم تسليم الاختبار تلقائياً.', variant: 'info' })
      await refetchAll()
    } catch {
      // error
    }
  }

  async function handleSubmit() {
    if (!user || !quiz) return
    const unanswered = quiz.questions.filter((q) => !answers[q.id])
    if (unanswered.length > 0) {
      toast({ title: `يرجى الإجابة على جميع الأسئلة (${unanswered.length} متبقية)`, variant: 'error' })
      return
    }
    try {
      const result = await submitQuiz(quiz.id, answers)
      setLocalResult({ score: result.score, maxScore: result.maxScore })
      setSubmitted(true)
      toast({ title: 'تم تسليم الاختبار بنجاح!', variant: 'success' })
      await refetchAll()
    } catch {
      // error toast already shown by DataContext
    }
  }

  const finalResult = existingResult
    ? { score: existingResult.score, maxScore: existingResult.maxScore }
    : localResult

  // تنسيق الوقت (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/student/quizzes"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-brand-600)] dark:text-[var(--color-dark-ink-soft)]"
      >
        <ArrowRight className="h-4 w-4" /> العودة إلى الاختبارات
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">{quiz.title}</h1>
          <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">{quiz.lessonTitle}</p>
        </div>

        {/* ⏱️ عداد الوقت */}
        {timeLeft !== null && !reviewMode && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg border-2",
            timeLeft < 60 ? "bg-rose-50 border-rose-500 text-rose-600 animate-pulse" : "bg-amber-50 border-amber-400 text-amber-700"
          )}>
            <Clock className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {finalResult && (
        <Card className="bg-gradient-to-l from-[var(--color-brand-600)] to-[var(--color-brand-500)] border-0">
          <CardContent className="p-6 flex items-center gap-4 text-white">
            <Trophy className="h-10 w-10 text-[var(--color-amber-300)]" />
            <div>
              <p className="font-display text-2xl font-extrabold">
                {finalResult.score} / {finalResult.maxScore}
              </p>
              <p className="text-white/80 text-sm mt-0.5">
                {Math.round((finalResult.score / finalResult.maxScore) * 100)}% نسبة الإجابات الصحيحة
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-5">
        {/* 🎲 بنعرض الأسئلة المخلوطة */}
        {shuffledQuestions.map((q, idx) => {
          const selected = displayAnswers[q.id]
          return (
            <Card key={q.id}>
              <CardContent className="p-5">
                <p className="font-semibold mb-4">
                  {idx + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {/* 🎲 بنعرض الاختيارات المخلوطة */}
                  {q.options.map(([optKey, optValue]) => {
                    const isSelected = selected === optKey
                    const isCorrect = q.correctAnswer === optKey
                    return (
                      <button
                        key={optKey}
                        type="button"
                        onClick={() => handleSelect(q.id, optKey)}
                        disabled={reviewMode}
                        className={cn(
                          'w-full flex items-center justify-between rounded-xl border p-3.5 text-sm text-right transition-colors',
                          !reviewMode &&
                            (isSelected
                              ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/30'
                              : 'border-black/10 hover:bg-black/[0.02] dark:border-[var(--color-dark-border)] dark:hover:bg-white/5'),
                          reviewMode &&
                            isCorrect &&
                            'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
                          reviewMode &&
                            isSelected &&
                            !isCorrect &&
                            'border-[var(--color-rose-500)] bg-[var(--color-rose-100)]',
                          reviewMode && !isSelected && !isCorrect && 'border-black/10 dark:border-[var(--color-dark-border)] opacity-60',
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="h-6 w-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">
                            {optKey}
                          </span>
                          {optValue}
                        </span>
                        {reviewMode && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                        {reviewMode && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-[var(--color-rose-500)] shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!reviewMode && (
        <Button size="lg" className="w-full" onClick={handleSubmit}>
          تسليم الاختبار
        </Button>
      )}
    </div>
  )
}