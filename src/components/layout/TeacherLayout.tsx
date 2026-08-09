import { Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, ClipboardCheck, Sparkles, Award, Megaphone, Settings, User } from 'lucide-react'
import { DashboardLayout } from './DashboardLayout'
import type { NavItem } from './Sidebar'

const items: NavItem[] = [
  { to: '/teacher', label: 'الرئيسية', icon: LayoutDashboard, end: true },
  { to: '/teacher/students', label: 'الطلاب', icon: Users },
  { to: '/teacher/lessons', label: 'الحصص', icon: BookOpen },
  { to: '/teacher/homework', label: 'الواجبات', icon: ClipboardCheck },
  { to: '/teacher/quizzes', label: 'الاختبارات', icon: Sparkles },
  { to: '/teacher/grades', label: 'الدرجات', icon: Award },
  { to: '/teacher/announcements', label: 'الإعلانات', icon: Megaphone },
  { to: '/teacher/profile', label: 'الملف الشخصي', icon: User },
  { to: '/teacher/settings', label: 'الإعدادات', icon: Settings },
]

const titles: Record<string, string> = {
  '/teacher': 'لوحة التحكم',
  '/teacher/students': 'إدارة الطلاب',
  '/teacher/lessons': 'الحصص الدراسية',
  '/teacher/homework': 'الواجبات',
  '/teacher/quizzes': 'الاختبارات',
  '/teacher/grades': 'الدرجات',
  '/teacher/announcements': 'الإعلانات',
  '/teacher/profile': 'الملف الشخصي',
  '/teacher/settings': 'الإعدادات',
}

export function TeacherLayout() {
  const location = useLocation()
  const title = titles[location.pathname] || 'منارة'

  return (
    <DashboardLayout items={items} title={title}>
      <Outlet />
    </DashboardLayout>
  )
}
