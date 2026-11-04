import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { ArrowRight, ArrowLeft, CheckCircle2, XCircle, Trophy, Clock, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { startQuizAttempt, getMyQuizAttempt } from '@/services/quizzesService'

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
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isLoadingTimer, setIsLoadingTimer] = useState(true)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isReviewing, setIsReviewing] = useState(false)

  const shuffledQuestions = useMemo(() => {
    if (!quiz) return []
    return quiz.questions.map((q) => ({
      ...q,
      options: shuffleArray(Object.entries(q.options))
    }))
  }, [quiz])

  const totalQuestions = shuffledQuestions.length
  const reviewMode = !!existingResult || submitted
  const displayAnswers = existingResult?.answers || answers

  // ⏱️ 1. سحب الوقت من الداتابيز (عشان لو عمل Refresh ميرجعش من الأول)
  useEffect(() => {
    async function checkAttempt() {
      if (!quiz || reviewMode) {
        setIsLoadingTimer(false)
        return
      }
      try {
        let attempt = await getMyQuizAttempt(quiz.id)
        
        // لو مفيش محاولة مسجلة، نسجل واحدة جديدة
        if (!attempt) {
          await startQuizAttempt(quiz.id, quiz.duration)
          attempt = await getMyQuizAttempt(quiz.id)
        }
        
        if (attempt) {
          const endsAtTime = new Date(attempt.ends_at).getTime()
          const now = Date.now()
          const remainingSeconds = Math.max(0, Math.floor((endsAtTime - now) / 1000))
          setTimeLeft(remainingSeconds)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoadingTimer(false)
      }
    }
    checkAttempt()
  }, [quiz, reviewMode])

  // ⏱️ 2. العداد التنازلي
  useEffect(() => {
    if (isLoadingTimer || timeLeft === null || reviewMode) return

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
  }, [isLoadingTimer, reviewMode, timeLeft === null]) // عشان ميعملش ريسيت للعداد كل ثانية

  // ⏱️ 3. تسليم تلقائي لما الوقت يخلص
  useEffect(() => {
    if (timeLeft === 0 && !submitted && !existingResult && !isLoadingTimer) {
      handleAutoSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isLoadingTimer])

  // 🚨 4. منع الغش
  useEffect(() => {
    if (reviewMode || !quiz) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isReviewing) {
        handleAutoSubmit()
        toast({ 
          title: 'تم تسليم الاختبار!', 
          description: 'لقد خرجت من صفحة الاختبار، وده يعتبر غش. تم تسليم إجاباتك تلقائياً.', 
          variant: 'error' 
        });
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [reviewMode, quiz, isReviewing])

  if (!quiz) return <Navigate to="/student/quizzes" replace />

  if (isLoadingTimer && !reviewMode) {
    return <div className="flex justify-center items-center h-64"><div className="h-8 w-8 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" /></div>
  }

  function handleSelect(qId: string, opt: string) {
    if (reviewMode) return
    setAnswers((prev) => ({ ...prev, [qId]: opt as 'A' | 'B' | 'C' | 'D' }))
  }

  async function handleAutoSubmit() {
    if (!user || !quiz) return
    try {
      const result = await submitQuiz(quiz.id, answers)
      setLocalResult({ score: result.score, maxScore: result.maxScore })
      setSubmitted(true)
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
      // error
    }
  }

  const finalResult = existingResult
    ? { score: existingResult.score, maxScore: existingResult.maxScore }
    : localResult

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const currentQuestion = shuffledQuestions[currentIndex]

  if (reviewMode || isReviewing) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        <Link to="/student/quizzes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-brand-600)]">
          <ArrowRight className="h-4 w-4" /> العودة إلى الاختبارات
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold">{quiz.title} - المراجعة</h1>
            <p className="text-[var(--color-ink-soft)] mt-1">{isReviewing ? 'راجع إجاباتك قبل التسليم' : 'مراجعة الإجابات'}</p>
          </div>
        </div>

        {finalResult && (
          <Card className="bg-gradient-to-l from-[var(--color-brand-600)] to-[var(--color-brand-500)] border-0 text-white">
            <CardContent className="p-6 flex items-center gap-4">
              <Trophy className="h-10 w-10 text-amber-300" />
              <div>
                <p className="font-display text-2xl font-extrabold">{finalResult.score} / {finalResult.maxScore}</p>
                <p className="text-white/80 text-sm mt-0.5">{Math.round((finalResult.score / finalResult.maxScore) * 100)}% نسبة الإجابات الصحيحة</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-5">
          {shuffledQuestions.map((q, idx) => {
            const selected = displayAnswers[q.id]
            return (
              <Card key={q.id}>
                <CardContent className="p-5">
                  <p className="font-semibold mb-4">{idx + 1}. {q.question}</p>
                  <div className="space-y-2">
                    {q.options.map(([optKey, optValue]) => {
                      const isSelected = selected === optKey
                      const isCorrect = q.correctAnswer === optKey
                      return (
                        <div
                          key={optKey}
                          className={cn(
                            'w-full flex items-center justify-between rounded-xl border p-3.5 text-sm text-right',
                            reviewMode ? (
                              isCorrect ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
                              isSelected && !isCorrect ? 'border-rose-500 bg-rose-100' : 'border-black/10 opacity-60'
                            ) : (
                              isSelected ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)]' : 'border-black/10'
                            )
                          )}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="h-6 w-6 rounded-full bg-black/5 flex items-center justify-center text-xs font-bold shrink-0">{optKey}</span>
                            {optValue}
                          </span>
                          {reviewMode && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          {reviewMode && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-rose-500" />}
                        </div>
                      )
                    })}
                  </div>
                  {reviewMode && q.explanation && (
                    <div className="mt-4 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-sm">
                      <span className="font-bold ml-1">💡 شرح:</span> {q.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {isReviewing && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[var(--color-dark-surface)] border-t border-black/10 flex justify-center">
             <div className="max-w-3xl w-full flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsReviewing(false)}>عودة للأسئلة</Button>
                <Button className="flex-1" onClick={handleSubmit}>تأكيد وتسليم الاختبار</Button>
             </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
         <h1 className="font-display text-xl font-bold">{quiz.title}</h1>
         {timeLeft !== null && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm border-2",
            timeLeft < 60 ? "bg-rose-50 border-rose-500 text-rose-600 animate-pulse" : "bg-amber-50 border-amber-400 text-amber-700"
          )}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm font-semibold text-[var(--color-ink-soft)] mb-2">
        <span>السؤال {currentIndex + 1} من {totalQuestions}</span>
        <span>تمت الإجابة على {Object.keys(answers).length} أسئلة</span>
      </div>

      {currentQuestion && (
        <Card>
          <CardContent className="p-6">
            <p className="font-semibold mb-6 text-lg">
              {currentQuestion.question}
            </p>
            <div className="space-y-3">
              {currentQuestion.options.map(([optKey, optValue]) => {
                const isSelected = answers[currentQuestion.id] === optKey
                return (
                  <button
                    key={optKey}
                    onClick={() => handleSelect(currentQuestion.id, optKey)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl border p-4 text-sm text-right transition-all',
                      isSelected 
                        ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] ring-2 ring-[var(--color-brand-500)]/20' 
                        : 'border-black/10 hover:border-[var(--color-brand-300)] hover:bg-black/[0.02]'
                    )}
                  >
                    <span className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                      isSelected ? "bg-[var(--color-brand-500)] text-white" : "bg-black/5"
                    )}>
                      {optKey}
                    </span>
                    {optValue}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
        >
          <ArrowRight className="h-4 w-4 ml-2" /> السابق
        </Button>

        {currentIndex < totalQuestions - 1 ? (
          <Button 
            size="lg"
            onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
          >
            التالي <ArrowLeft className="h-4 w-4 mr-2" />
          </Button>
        ) : (
          <Button 
            size="lg" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setIsReviewing(true)}
          >
            <Check className="h-4 w-4 mr-2" /> مراجعة وتسليم
          </Button>
        )}
      </div>

      <Card className="mt-8">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-3">خريطة الأسئلة (اضغط للانتقال)</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {shuffledQuestions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all border",
                    isCurrent ? "ring-2 ring-[var(--color-brand-500)] ring-offset-2 dark:ring-offset-[var(--color-dark-surface)] border-transparent" : "border-transparent",
                    isAnswered 
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" 
                      : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
                  )}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}