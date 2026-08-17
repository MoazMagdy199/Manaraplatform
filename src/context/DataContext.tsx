import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  Lesson,
  Homework,
  HomeworkSubmission,
  Quiz,
  QuizQuestion,
  QuizResult,
  Announcement,
  User,
  StudentGrade,
  AttendanceSummaryRow,
} from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { extractSupabaseErrorMessage } from '@/lib/supabase'

import * as studentsApi from '@/services/studentsService'
import * as attendanceApi from '@/services/attendanceService'
import * as lessonsApi from '@/services/lessonsService'
import * as homeworkApi from '@/services/homeworkService'
import * as quizzesApi from '@/services/quizzesService'
import * as announcementsApi from '@/services/announcementsService'
import * as gradesApi from '@/services/gradesService'

interface DataContextValue {
  loading: boolean

  // students
  students: User[]
  addStudent: (s: studentsApi.CreateStudentInput) => Promise<void>
  updateStudent: (id: string, patch: studentsApi.UpdateStudentInput) => Promise<void>
  removeStudent: (id: string) => Promise<void>
  resetPassword: (id: string) => Promise<string>

  // lessons
  lessons: Lesson[]
  addLesson: (l: lessonsApi.UpsertLessonInput) => Promise<void>
  updateLesson: (id: string, patch: lessonsApi.UpsertLessonInput) => Promise<void>
  removeLesson: (id: string) => Promise<void>
  markLessonRead: (id: string) => Promise<void>

  // homework
  homework: Homework[]
  addHomework: (h: homeworkApi.UpsertHomeworkInput) => Promise<void>
  updateHomework: (id: string, patch: homeworkApi.UpsertHomeworkInput) => Promise<void>
  removeHomework: (id: string) => Promise<void>
  submissions: HomeworkSubmission[]
  submitHomework: (s: { homeworkId: string; answer: string; fileUrls?: string[] }) => Promise<void>
  gradeSubmission: (id: string, grade: number, feedback: string) => Promise<void>

  // quizzes
  quizzes: Quiz[]
  addQuiz: (q: { lessonId: string; title: string; duration: number; questions: QuizQuestion[] }) => Promise<void>
  removeQuiz: (id: string) => Promise<void>
  quizResults: QuizResult[]
  submitQuiz: (quizId: string, answers: Record<string, 'A' | 'B' | 'C' | 'D'>) => Promise<QuizResult>

  // announcements
  announcements: Announcement[]
  addAnnouncement: (a: announcementsApi.UpsertAnnouncementInput) => Promise<void>
  updateAnnouncement: (id: string, patch: announcementsApi.UpsertAnnouncementInput) => Promise<void>
  removeAnnouncement: (id: string) => Promise<void>

  grades: StudentGrade[]
  updateGrade: (studentId: string, homeworkAvg: number, quizAvg: number) => Promise<void>
  attendanceSummary: AttendanceSummaryRow[]
  refetchAll: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const isTeacher = user?.role === 'Teacher'

  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<User[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [homework, setHomework] = useState<Homework[]>([])
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [grades, setGrades] = useState<StudentGrade[]>([])
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummaryRow[]>([])

  const handleError = useCallback(
    (err: unknown, fallback: string) => {
      toast({ title: extractSupabaseErrorMessage(err, fallback), variant: 'error' })
    },
    [toast],
  )

  const loadAll = useCallback(async () => {
    if (!user) {
      setStudents([]); setLessons([]);setAttendanceSummary([]); setHomework([]); setSubmissions([])
      setQuizzes([]); setQuizResults([]); setAnnouncements([]); setGrades([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const tasks: Promise<void>[] = [
        lessonsApi.fetchLessons().then(setLessons),
        homeworkApi.fetchHomework().then(setHomework),
        homeworkApi.fetchSubmissions().then(setSubmissions),
        quizzesApi.fetchQuizzes().then(setQuizzes),
        announcementsApi.fetchAnnouncements().then(setAnnouncements),
      ]

     if (isTeacher) {
  const [studentsData, gradesData] = await Promise.all([
    studentsApi.fetchStudents(),
    gradesApi.fetchAllGrades(),
  ])

  setStudents(studentsData)
  setGrades(gradesData)

  const gradeList = [
    ...new Set(
      studentsData
        .map((student) => student.grade)
        .filter((grade): grade is string => Boolean(grade)),
    ),
  ]

  const summaries = await Promise.all(
    gradeList.map((grade) => attendanceApi.fetchAttendanceSummary(grade)),
  )

  setAttendanceSummary(summaries.flat())

} else {
  tasks.push(quizzesApi.fetchMyQuizResults().then(setQuizResults))
  tasks.push(gradesApi.fetchMyGrade().then((g) => setGrades([g])))

  tasks.push(
    attendanceApi.fetchMyAttendanceSummary().then((summary) => {
      setAttendanceSummary([summary])
    }),
  )
}

await Promise.all(tasks)
    } catch (err) {
      handleError(err, 'تعذّر تحميل بيانات المنصة')
    } finally {
      setLoading(false)
    }
  }, [user, isTeacher, handleError])

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const value = useMemo<DataContextValue>(
    () => ({
      loading,

      students,
      attendanceSummary,
      addStudent: async (s) => {
        try {
          const created = await studentsApi.createStudent(s)
          setStudents((prev) => [created, ...prev])
        } catch (err) {
          handleError(err, 'تعذّرت إضافة الطالب')
          throw err
        }
      },
      updateStudent: async (id, patch) => {
        try {
          const updated = await studentsApi.updateStudent(id, patch)
          setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)))
        } catch (err) {
          handleError(err, 'تعذّر تحديث بيانات الطالب')
          throw err
        }
      },
      removeStudent: async (id) => {
        try {
          await studentsApi.deleteStudent(id)
          setStudents((prev) => prev.filter((s) => s.id !== id))
        } catch (err) {
          handleError(err, 'تعذّر حذف الطالب')
          throw err
        }
      },
      resetPassword: async (id) => {
        try {
          return await studentsApi.resetStudentPassword(id)
        } catch (err) {
          handleError(err, 'تعذّر إعادة تعيين كلمة المرور')
          throw err
        }
      },

      lessons,
      addLesson: async (l) => {
        try {
          const created = await lessonsApi.createLesson(l)
          setLessons((prev) => [created, ...prev])
        } catch (err) {
          handleError(err, 'تعذّرت إضافة الحصة')
          throw err
        }
      },
      updateLesson: async (id, patch) => {
        try {
          const updated = await lessonsApi.updateLesson(id, patch)
          setLessons((prev) => prev.map((l) => (l.id === id ? updated : l)))
        } catch (err) {
          handleError(err, 'تعذّر تحديث الحصة')
          throw err
        }
      },
      removeLesson: async (id) => {
        try {
          await lessonsApi.deleteLesson(id)
          setLessons((prev) => prev.filter((l) => l.id !== id))
        } catch (err) {
          handleError(err, 'تعذّر حذف الحصة')
          throw err
        }
      },
      markLessonRead: async (id) => {
        try {
          await lessonsApi.markLessonRead(id)
          setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, completedByStudent: true } : l)))
        } catch (err) {
          handleError(err, 'تعذّر تحديث حالة الحصة')
          throw err
        }
      },

      homework,
      addHomework: async (h) => {
        try {
          const created = await homeworkApi.createHomework(h)
          setHomework((prev) => [created, ...prev])
        } catch (err) {
          handleError(err, 'تعذّرت إضافة الواجب')
          throw err
        }
      },
      updateHomework: async (id, patch) => {
        try {
          const updated = await homeworkApi.updateHomework(id, patch)
          setHomework((prev) => prev.map((h) => (h.id === id ? updated : h)))
        } catch (err) {
          handleError(err, 'تعذّر تحديث الواجب')
          throw err
        }
      },
      removeHomework: async (id) => {
        try {
          await homeworkApi.deleteHomework(id)
          setHomework((prev) => prev.filter((h) => h.id !== id))
        } catch (err) {
          handleError(err, 'تعذّر حذف الواجب')
          throw err
        }
      },
      submissions,
      submitHomework: async (s) => {
        try {
          const created = await homeworkApi.submitHomework(s)
          setSubmissions((prev) => [created, ...prev])
        } catch (err) {
          handleError(err, 'تعذّر إرسال الواجب')
          throw err
        }
      },
      gradeSubmission: async (id, grade, feedback) => {
        try {
          const updated = await homeworkApi.gradeSubmission(id, grade, feedback)
          setSubmissions((prev) => prev.map((s) => (s.id === id ? updated : s)))
        } catch (err) {
          handleError(err, 'تعذّر حفظ التصحيح')
          throw err
        }
      },

      quizzes,
      addQuiz: async (q) => {
        try {
          const created = await quizzesApi.createQuiz(q)
          setQuizzes((prev) => [created, ...prev])
        } catch (err) {
          handleError(err, 'تعذّر إنشاء الاختبار')
          throw err
        }
      },
      removeQuiz: async (id) => {
        try {
          await quizzesApi.deleteQuiz(id)
          setQuizzes((prev) => prev.filter((q) => q.id !== id))
        } catch (err) {
          handleError(err, 'تعذّر حذف الاختبار')
          throw err
        }
      },
      quizResults,
      submitQuiz: async (quizId, answers) => {
        try {
          const result = await quizzesApi.submitQuiz(quizId, answers)
          setQuizResults((prev) => [...prev, result])
          return result
        } catch (err) {
          handleError(err, 'تعذّر إرسال الاختبار')
          throw err
        }
      },

      announcements,
      addAnnouncement: async (a) => {
        try {
          const created = await announcementsApi.createAnnouncement(a)
          setAnnouncements((prev) => [created, ...prev])
        } catch (err) {
          handleError(err, 'تعذّرت إضافة الإعلان')
          throw err
        }
      },
      updateAnnouncement: async (id, patch) => {
        try {
          const updated = await announcementsApi.updateAnnouncement(id, patch)
          setAnnouncements((prev) => prev.map((a) => (a.id === id ? updated : a)))
        } catch (err) {
          handleError(err, 'تعذّر تحديث الإعلان')
          throw err
        }
      },
      removeAnnouncement: async (id) => {
        try {
          await announcementsApi.deleteAnnouncement(id)
          setAnnouncements((prev) => prev.filter((a) => a.id !== id))
        } catch (err) {
          handleError(err, 'تعذّر حذف الإعلان')
          throw err
        }
      },

      grades,
      updateGrade: async (studentId, homeworkAvg, quizAvg) => {
        try {
          const updated = await gradesApi.updateStudentGrade(studentId, homeworkAvg, quizAvg)
          setGrades((prev) => {
            const exists = prev.some((g) => g.studentId === studentId)
            return exists ? prev.map((g) => (g.studentId === studentId ? updated : g)) : [...prev, updated]
          })
        } catch (err) {
          handleError(err, 'تعذّر تحديث الدرجة')
          throw err
        }
      },

      refetchAll: loadAll,
    }),
    [loading, students, lessons, homework, submissions, quizzes, quizResults,attendanceSummary, announcements, grades, handleError, loadAll],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
