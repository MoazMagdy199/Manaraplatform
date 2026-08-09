import { Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, BookOpen, ClipboardCheck, Sparkles, Award, Megaphone, Trophy, Settings, User } from 'lucide-react'
import { DashboardLayout } from './DashboardLayout'
import type { NavItem } from './Sidebar'

const items: NavItem[] = [
  { to: '/student', label: 'الرئيسية', icon: LayoutDashboard, end: true },
  { to: '/student/lessons', label: 'الحصص', icon: BookOpen },
  { to: '/student/homework', label: 'الواجبات', icon: ClipboardCheck },
  { to: '/student/quizzes', label: 'الاختبارات', icon: Sparkles },
  { to: '/student/grades', label: 'درجاتي', icon: Award },
  { to: '/student/achievements', label: 'الإنجازات', icon: Trophy },
  { to: '/student/announcements', label: 'الإعلانات', icon: Megaphone },
  { to: '/student/profile', label: 'الملف الشخصي', icon: User },
  { to: '/student/settings', label: 'الإعدادات', icon: Settings },
]

const titleFor = (path: string) => {
  if (path.startsWith('/student/lessons/')) return 'تفاصيل الحصة'
  if (path.startsWith('/student/quizzes/')) return 'الاختبار'
  const titles: Record<string, string> = {
    '/student': 'لوحة الطالب',
    '/student/lessons': 'الحصص الدراسية',
    '/student/homework': 'الواجبات',
    '/student/quizzes': 'الاختبارات',
    '/student/grades': 'درجاتي',
    '/student/achievements': 'الإنجازات',
    '/student/announcements': 'الإعلانات',
    '/student/profile': 'الملف الشخصي',
    '/student/settings': 'الإعدادات',
  }
  return titles[path] || 'منارة'
}

export function StudentLayout() {
  const location = useLocation()
  return (
    <DashboardLayout items={items} title={titleFor(location.pathname)}>
      <Outlet />
    </DashboardLayout>
  )
}
