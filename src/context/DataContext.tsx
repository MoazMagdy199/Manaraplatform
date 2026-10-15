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
import { logActivity } from '@/services/activityService'

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
  const isTeacher = user?.role === 'Teacher' || user?.role === 'Assistant'

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
      setStudents([]); setLessons([]); setAttendanceSummary([]); setHomework([]); setSubmissions([])
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
        const allResults = await quizzesApi.fetchAllQuizResults()
        setQuizResults(allResults)
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
          if (user) {
            logActivity({
              user,
              actionType: 'create',
              entityType: 'student',
              entityId: created.id,
              description: `أضاف طالب جديد: ${s.name}`,
            })
          }
        } catch (err) {
          handleError(err, 'تعذّرت إضافة الطالب')
          throw err
        }
      },
      updateStudent: async (id, patch) => {
        try {
          const updated = await studentsApi.updateStudent(id, patch)
          setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)))
          if (user) {
            logActivity({
              user,
              actionType: 'update',
              entityType: 'student',
              entityId: id,
              description: `عدّل بيانات الطالب: ${patch.name || updated.name}`,
            })
          }
        } catch (err) {
          handleError(err, 'تعذّر تحديث بيانات الطالب')
          throw err
        }
      },
      removeStudent: async (id) => {
        try {
          const target = students.find((s) => s.id === id)
          await studentsApi.deleteStudent(id)
          setStudents((prev) => prev.filter((s) => s.id !== id))
          if (user) {
            logActivity({
              user,
              actionType: 'delete',
              entityType: 'student',
              entityId: id,
              description: `حذف الطالب: ${target?.name || id}`,
            })
          }
        } catch (err) {
          handleError(err, 'تعذّر حذف الطالب')
          throw err
        }
      },
      resetPassword: async (id) => {
        try {
          const pwd = await studentsApi.resetStudentPassword(id)
          const target = students.find((s) => s.id === id)
          if (user) {
            logActivity({
              user,
              actionType: 'update',
              entityType: 'student',
              entityId: id,
              description: `أعاد تعيين كلمة مرور الطالب: ${target?.name || id}`,
            })
          }
          return pwd
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
          if (user) {
            logActivity({
              user,
              actionType: 'create',
              entityType: 'lesson',
              entityId: created.id,
              description: `أضاف حصة جديدة: ${l.title}`,
            })
          }
        } catch (err) {
          handleError(err, 'تعذّرت إضافة الحصة')
          throw err
        }
      },
      updateLesson: async (id, patch) => {
        try {
          const updated = await lessonsApi.updateLesson(id, patch)
          setLessons((prev) => prev.map((l) => (l.id === id ? updated : l)))
          if (user) {
            logActivity({
              user,
              actionType: 'update',
              entityType: 'lesson',
              entityId: id,
              description: `عدّل حصة: ${patch.title || updated.title}`,
            })
          }
        } catch (err) {
          handleError(err, 'تعذّر تحديث الحصة')
          throw err
        }
      },
      removeLesson: async (id) => {
        try {
          const target = lessons.find((l) => l.id === id)
          await lessonsApi.deleteLesson(id)
          setLessons((prev) => prev.filter((l) => l.id !== id))
          if (user) {
            logActivity({
              user,
              actionType: 'delete',
              entityType: 'lesson',
              entityId: id,
              description: `حذف حصة: ${target?.title || id}`,
            })
          }
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
          if (user) {
            logActivity({
              user,
              actionType: 'create',
              entityType: 'homework',
              entityId: created.id,
              description: `أضاف واجب جديد: ${h.title}`,
            })
          }
        } catch (err) {
          handleError(err, 'تعذّرت إضافة الواجب')
          throw err
        }
      },
      updateHomework: async (id, patch) => {
        try {
          const updated = await homeworkApi.updateHomework(id, patch)
          setHomework((prev) => prev.map((h) => (h.id === id ? updated : h)))
          if (user) {
            logActivity({
              user,
              actionType: 'update',
              entityType: 'homework',
              entityId: id,
              description: `عدّل واجب: ${patch.title || updated.title}`,
            })
          }
        } catch (err) {
          handleError(err, 'تعذّر تحديث الواجب')
          throw err
        }
      },
      removeHomework: async (id) => {
        try {
          const target = homework.find((h) => h.id === id)
          await homeworkApi.deleteHomework(id)
          setHomework((prev) => prev.filter((h) => h.id !== id))
          if (user) {
            logActivity({
              user,
              actionType: 'delete',
              entityType: 'homework',
              entityId: id,
              description: `حذف واجب: ${target?.title || id}`,
            })
          }
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
          if (user) {
            logActivity({
              user,
              actionType: 'update',
              entityType: 'submission',
              entityId: id,
              description: `صحّح واجب الطالب: ${updated.studentName} (${grade} درجة)`,
            })
          }
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
          if (user) {
            logActivity({
              user,
              actionType: 'create',
              entityType: 'quiz',
              entityId: created.id,
              description: `أنشأ اختبار جديد: ${q.title}`,
            })
          }
        } catch (err) {
          handleError(err, 'تعذّر إنشاء الاختبار')
          throw err
        }
      },
      removeQuiz: async (id) => {
        try {
          const target = quizzes.find((q) => q.id === id)
          await quizzesApi.deleteQuiz(id)
          setQuizzes((prev) => prev.filter((q) => q.id !== id))
          if (user) {
            logActivity({
              user,
              actionType: 'delete',
              entityType: 'quiz',
              entityId: id,
              description: `حذف اختبار: ${target?.title || id}`,
            })
          }
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
          if (user) {
            logActivity({
              user,
              actionType: 'create',
              entityType: 'announcement',
              entityId: created.id,
              description: `أضاف إعلان: ${a.title}`,
            })
          }
        } catch (err) {
          handleError(err, 'تعذّرت إضافة الإعلان')
          throw err
        }
      },
      updateAnnouncement: async (id, patch) => {
        try {
          const updated = await announcementsApi.updateAnnouncement(id, patch)
          setAnnouncements((prev) => prev.map((a) => (a.id === id ? updated : a)))
          if (user) {
            logActivity({
              user,
              actionType: 'update',
              entityType: 'announcement',
              entityId: id,
              description: `عدّل إعلان: ${patch.title || updated.title}`,
            })
          }
        } catch (err) {
          handleError(err, 'تعذّر تحديث الإعلان')
          throw err
        }
      },
      removeAnnouncement: async (id) => {
        try {
          const target = announcements.find((a) => a.id === id)
          await announcementsApi.deleteAnnouncement(id)
          setAnnouncements((prev) => prev.filter((a) => a.id !== id))
          if (user) {
            logActivity({
              user,
              actionType: 'delete',
              entityType: 'announcement',
              entityId: id,
              description: `حذف إعلان: ${target?.title || id}`,
            })
          }
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
          if (user) {
            const target = students.find((s) => s.id === studentId)
            logActivity({
              user,
              actionType: 'update',
              entityType: 'grade',
              entityId: studentId,
              description: `حدّث درجة الطالب: ${target?.name || studentId}`,
            })
          }
        } catch (err) {
          handleError(err, 'تعذّر تحديث الدرجة')
          throw err
        }
      },

      refetchAll: loadAll,
    }),
    [loading, students, lessons, homework, submissions, quizzes, quizResults, attendanceSummary, announcements, grades, handleError, loadAll, user],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}