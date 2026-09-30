import { Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  Sparkles,
  Award,
  Megaphone,
  FileBarChart,
  Settings,
  User,
  Layers,
  LogIn,
  CalendarCheck,
  Wallet,
} from 'lucide-react'
import { DashboardLayout } from './DashboardLayout'
import type { NavItem } from './Sidebar'

const items: NavItem[] = [
  { to: '/teacher', label: 'الرئيسية', icon: LayoutDashboard, end: true },
  { to: '/teacher/students', label: 'الطلاب', icon: Users },
  { to: '/teacher/attendance', label: 'الحضور والغياب', icon: CalendarCheck },
  { to: '/teacher/lessons', label: 'الحصص', icon: BookOpen },
  { to: '/teacher/homework', label: 'الواجبات', icon: ClipboardCheck },
  { to: '/teacher/quizzes', label: 'الاختبارات', icon: Sparkles },
  { to: '/teacher/payments', label: 'الاشتراكات', icon: Wallet },
  { to: '/teacher/weekly-report', label: 'التقرير الأسبوعي', icon: FileBarChart },
  { to: '/teacher/grades', label: 'الدرجات', icon: Award },
  { to: '/teacher/announcements', label: 'الإعلانات', icon: Megaphone },
  { to: '/teacher/groups', label: 'المجموعات', icon: Layers },
  { to: '/teacher/last-logins', label: 'آخر تسجيلات الدخول', icon: LogIn },
  { to: '/teacher/profile', label: 'الملف الشخصي', icon: User },
  { to: '/teacher/settings', label: 'الإعدادات', icon: Settings },
]

const titles: Record<string, string> = {
  '/teacher': 'لوحة التحكم',
  '/teacher/students': 'إدارة الطلاب',
  '/teacher/attendance': 'الحضور والغياب',
  '/teacher/lessons': 'الحصص الدراسية',
  '/teacher/homework': 'الواجبات',
  '/teacher/quizzes': 'الاختبارات',
  '/teacher/payments': 'متابعة الاشتراك الشهري',
  '/teacher/weekly-report': 'التقرير الأسبوعي',
  '/teacher/grades': 'الدرجات',
  '/teacher/announcements': 'الإعلانات',
  '/teacher/profile': 'الملف الشخصي',
  '/teacher/groups': 'المجموعات',
  '/teacher/last-logins': 'آخر تسجيلات الدخول',
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