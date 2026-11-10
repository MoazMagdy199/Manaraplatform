import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { DataProvider } from '@/context/DataContext'
import { ToastProvider } from '@/context/ToastContext'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { useAuth } from '@/context/AuthContext' // 👈 ضفنا دي

import LandingPage from '@/pages/public/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'

import { TeacherLayout } from '@/components/layout/TeacherLayout'
import StudentsPage from '@/pages/teacher/StudentsPage'
import StudentProfilePage from '@/pages/teacher/StudentProfilePage'
import StudentReportPage from '@/pages/shared/StudentReportPage'
import TeacherWeeklyReportPage from '@/pages/teacher/WeeklyReportPage'
import TeacherPaymentsPage from '@/pages/teacher/PaymentsPage'
import TeacherGradesPage from '@/pages/teacher/GradesPage'

import ProfilePage from '@/pages/shared/ProfilePage'
import SettingsPage from '@/pages/shared/SettingsPage'
import AttendancePage from '@/pages/teacher/AttendancePage'

// 👈 كومبوننت صغير عشان يوجه كل واحد حسب صلاحيته
function TeacherIndexRedirect() {
  const { user } = useAuth()
  
  if (user?.role === 'Assistant') {
    return <Navigate to="/teacher/attendance" replace />
  }
  return <Navigate to="/teacher/students" replace />
}

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
                  {/* 👈 بنستخدم الكومبوننت الجديد عشان يوجه المساعد للحضور */}
                  <Route index element={<TeacherIndexRedirect />} />
                  
                  <Route path="students" element={<StudentsPage />} />
                  <Route path="students/:id" element={<StudentProfilePage />} />
                  <Route path="students/:id/report" element={<StudentReportPage />} />
                  
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="grades" element={<TeacherGradesPage />} />
                  <Route path="payments" element={<TeacherPaymentsPage />} />
                  <Route path="weekly-report" element={<TeacherWeeklyReportPage />} />
                  
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
export default App