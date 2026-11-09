import { Outlet, useLocation } from 'react-router-dom'
import {
  Users,
  Award,
  CalendarCheck,
  Wallet,
  FileBarChart,
  Settings,
  User,
} from 'lucide-react'
import { DashboardLayout } from './DashboardLayout'
import type { NavItem } from './Sidebar'

const items: NavItem[] = [
  { to: '/teacher/students', label: 'الطلاب', icon: Users },
  { to: '/teacher/attendance', label: 'الحضور والغياب', icon: CalendarCheck },
  { to: '/teacher/grades', label: 'الدرجات', icon: Award },
  { to: '/teacher/payments', label: 'الاشتراكات', icon: Wallet },
  { to: '/teacher/weekly-report', label: 'التقرير الأسبوعي', icon: FileBarChart },
  { to: '/teacher/profile', label: 'الملف الشخصي', icon: User },
  { to: '/teacher/settings', label: 'الإعدادات', icon: Settings },
]

const titles: Record<string, string> = {
  '/teacher/students': 'إدارة الطلاب',
  '/teacher/attendance': 'الحضور والغياب',
  '/teacher/grades': 'الدرجات',
  '/teacher/payments': 'متابعة الاشتراك الشهري',
  '/teacher/weekly-report': 'التقرير الأسبوعي',
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