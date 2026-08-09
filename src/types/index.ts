export type Role = 'Teacher' | 'Student'

export interface User {
  id: string
  name: string
  username: string
  email: string
  phone: string
  role: Role
  grade?: string
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
  deadline: string
  maxGrade: number
  createdAt: string
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
