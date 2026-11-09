import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  User,
  AttendanceSummaryRow,
} from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { extractSupabaseErrorMessage } from '@/lib/supabase'

import * as studentsApi from '@/services/studentsService'
import * as attendanceApi from '@/services/attendanceService'
import { logActivity } from '@/services/activityService'

// 👈 شيلنا كل الاستيرادات اللي ملهاش لازمة (حصص، واجبات، الخ)

interface DataContextValue {
  loading: boolean

  // students
  students: User[]
  addStudent: (s: studentsApi.CreateStudentInput) => Promise<void>
  updateStudent: (id: string, patch: studentsApi.UpdateStudentInput) => Promise<void>
  removeStudent: (id: string) => Promise<void>

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
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummaryRow[]>([])

  const handleError = useCallback(
    (err: unknown, fallback: string) => {
      toast({ title: extractSupabaseErrorMessage(err, fallback), variant: 'error' })
    },
    [toast],
  )

  const loadAll = useCallback(async () => {
    if (!user) {
      setStudents([])
      setAttendanceSummary([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      if (isTeacher) {
        const studentsData = await studentsApi.fetchStudents()
        setStudents(studentsData)

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
      }
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

      refetchAll: loadAll,
    }),
    [loading, students, attendanceSummary, handleError, loadAll, user],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}