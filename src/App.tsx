import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { DataProvider } from '@/context/DataContext'
import { ToastProvider } from '@/context/ToastContext'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { NotificationBanner } from '@/components/shared/NotificationBanner'

import LandingPage from '@/pages/public/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'

import { TeacherLayout } from '@/components/layout/TeacherLayout'
import TeacherDashboard from '@/pages/teacher/TeacherDashboard'
import StudentsPage from '@/pages/teacher/StudentsPage'
import StudentProfilePage from '@/pages/teacher/StudentProfilePage'
import StudentReportPage from '@/pages/shared/StudentReportPage' // 👈 تمت الإضافة
import LastLoginsPage from '@/pages/teacher/LastLoginsPage'
import AssistantPage from '@/pages/teacher/AssistantPage'
import TeacherLessonsPage from '@/pages/teacher/LessonsPage'
import TeacherHomeworkPage from '@/pages/teacher/HomeworkPage'
import TeacherQuizzesPage from '@/pages/teacher/QuizzesPage'
import TeacherWeeklyReportPage from '@/pages/teacher/WeeklyReportPage'
import TeacherPaymentsPage from '@/pages/teacher/PaymentsPage'
import TeacherGradesPage from '@/pages/teacher/GradesPage'
import TeacherAnnouncementsPage from '@/pages/teacher/AnnouncementsPage'
import GroupsPage from '@/pages/teacher/GroupsPage'

import { AssistantLayout } from '@/components/layout/AssistantLayout'
import AssistantDashboard from '@/pages/assistant/AssistantDashboard'
import ContactsPage from '@/pages/assistant/ContactsPage'

import { StudentLayout } from '@/components/layout/StudentLayout'
import StudentDashboard from '@/pages/student/StudentDashboard'
import StudentLessonsPage from '@/pages/student/LessonsPage'
import LessonDetailPage from '@/pages/student/LessonDetailPage'
import StudentHomeworkPage from '@/pages/student/HomeworkPage'
import StudentQuizzesPage from '@/pages/student/QuizzesPage'
import QuizTakePage from '@/pages/student/QuizTakePage'
import StudentGradesPage from '@/pages/student/GradesPage'
import StudentAnnouncementsPage from '@/pages/student/AnnouncementsPage'
import AchievementsPage from '@/pages/student/AchievementsPage'

import ProfilePage from '@/pages/shared/ProfilePage'
import SettingsPage from '@/pages/shared/SettingsPage'
import AttendancePage from '@/pages/teacher/AttendancePage'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />

                <Route
                  path="/teacher"
                  element={
                    <ProtectedRoute role="Teacher">
                      <TeacherLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<TeacherDashboard />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="students" element={<StudentsPage />} />
                  <Route path="students/:id" element={<StudentProfilePage />} />
                  <Route path="students/:id/report" element={<StudentReportPage />} /> {/* 👈 تمت الإضافة */}
                  <Route path="lessons" element={<TeacherLessonsPage />} />
                  <Route path="homework" element={<TeacherHomeworkPage />} />
                  <Route path="quizzes" element={<TeacherQuizzesPage />} />
                  <Route path="weekly-report" element={<TeacherWeeklyReportPage />} />
                  <Route path="payments" element={<TeacherPaymentsPage />} />
                  <Route path="grades" element={<TeacherGradesPage />} />
                  <Route path="announcements" element={<TeacherAnnouncementsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="groups" element={<GroupsPage />} />
                  <Route path="last-logins" element={<LastLoginsPage />} />
                  <Route path="assistant" element={<AssistantPage />} />
                </Route>

                <Route
                  path="/assistant"
                  element={
                    <ProtectedRoute role="Assistant">
                      <AssistantLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AssistantDashboard />} />
                  <Route path="students" element={<StudentsPage />} />
                  <Route path="students/:id" element={<StudentProfilePage />} />
                  <Route path="students/:id/report" element={<StudentReportPage />} /> {/* 👈 تمت الإضافة */}
                  <Route path="contacts" element={<ContactsPage />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="lessons" element={<TeacherLessonsPage />} />
                  <Route path="homework" element={<TeacherHomeworkPage />} />
                  <Route path="quizzes" element={<TeacherQuizzesPage />} />
                  <Route path="weekly-report" element={<TeacherWeeklyReportPage />} />
                  <Route path="payments" element={<TeacherPaymentsPage />} />
                  <Route path="grades" element={<TeacherGradesPage />} />
                  <Route path="announcements" element={<TeacherAnnouncementsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="groups" element={<GroupsPage />} />
                </Route>

                <Route
                  path="/student"
                  element={
                    <ProtectedRoute role="Student">
                      <StudentLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<StudentDashboard />} />
                  <Route path="lessons" element={<StudentLessonsPage />} />
                  <Route path="lessons/:id" element={<LessonDetailPage />} />
                  <Route path="homework" element={<StudentHomeworkPage />} />
                  <Route path="quizzes" element={<StudentQuizzesPage />} />
                  <Route path="quizzes/:id" element={<QuizTakePage />} />
                  <Route path="grades" element={<StudentGradesPage />} />
                  <Route path="achievements" element={<AchievementsPage />} />
                  <Route path="announcements" element={<StudentAnnouncementsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              <NotificationBanner />
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
export default App