export type Role = 'Teacher' | 'Student' | 'Assistant'

export interface User {
  id: string
  name: string
  username: string
  email: string
  phone: string
  role: Role
  grade?: string
  parentPhone?: string | null
  parentName?: string | null
  groupId?: string | null
  avatarUrl?: string
  createdAt: string
}

export interface Lesson {
  id: string
  title: string
  description: string
  content: string
  pdfUrl?: string
  videoUrl?: string
  imageUrl?: string
  groupId?: string | null
  grade?: string | null // null/undefined = ظاهرة لكل الصفوف
  attachments: { id?: string; name: string; url: string }[]
  createdAt: string
  completedByStudent?: boolean
}

export interface Homework {
  id: string
  lessonId: string
  lessonTitle: string
  title: string
  description: string
  imageUrl?: string | null
  deadline: string
  maxGrade: number
  createdAt: string
}

export interface MissingStudent {
  id: string
  name: string
  username: string
  grade: string | null
}

export interface HomeworkSubmission {
  id: string
  homeworkId: string
  homeworkTitle?: string
  studentId: string
  studentName: string
  answer: string
  fileUrls: string[]
  grade: number | null
  maxGrade: number
  feedback: string | null
  submittedAt: string
  status: 'pending' | 'graded' | 'late'
}

export interface QuizQuestion {
  id: string
  question: string
  options: { A: string; B: string; C: string; D: string }
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  points: number
}

export interface Quiz {
  id: string
  lessonId: string
  lessonTitle: string
  title: string
  duration: number
  questions: QuizQuestion[]
  createdAt: string
}

export interface QuizResult {
  id: string
  quizId: string
  studentId: string
  score: number
  maxScore: number
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>
  submittedAt: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  pinned: boolean
  createdAt: string
}

export interface Badge {
  id: string
  icon: string
  title: string
  description: string
  earned: boolean
  earnedAt?: string
}

export interface StudentGrade {
  studentId: string
  studentName: string
  grade: string | null
  homeworkAvg: number
  quizAvg: number
  overall: number
}

export type AttendanceStatus = 'present' | 'absent' | null

export interface AttendanceRow {
  studentId: string
  name: string
  username: string
  status: AttendanceStatus
}

export interface AttendanceSummaryRow {
  studentId: string
  name: string
  grade: string | null
  presentCount: number
  absentCount: number
  totalCount: number
  attendancePercentage: number
  absencePercentage: number
}
export interface MyAttendanceSummary {
  studentId: string
  name: string
  grade: string | null
  presentCount: number
  absentCount: number
  totalCount: number
  attendancePercentage: number
  absencePercentage: number
}
// 0 = الأحد ... 6 = السبت (نفس ترقيم JS Date.getDay())
export interface ScheduleDay {
  id: string
  grade: string
  dayOfWeek: number
  label?: string | null
}
export interface PaymentRow {
  studentId: string
  name: string
  username: string
  paid: boolean
  amount: number | null
  paidAt: string | null
  notes: string | null
}

export interface PaymentsOverviewRow {
  grade: string
  totalStudents: number
  paidStudents: number
}