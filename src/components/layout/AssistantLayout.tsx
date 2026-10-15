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
  CalendarCheck,
  Wallet,
  Phone,
} from 'lucide-react'
import { DashboardLayout } from './DashboardLayout'
import type { NavItem } from './Sidebar'

const items: NavItem[] = [
  { to: '/assistant', label: 'الرئيسية', icon: LayoutDashboard, end: true },
  { to: '/assistant/students', label: 'الطلاب', icon: Users },
  { to: '/assistant/contacts', label: 'جهات الاتصال', icon: Phone },
  { to: '/assistant/attendance', label: 'الحضور والغياب', icon: CalendarCheck },
  { to: '/assistant/lessons', label: 'الحصص', icon: BookOpen },
  { to: '/assistant/homework', label: 'الواجبات', icon: ClipboardCheck },
  { to: '/assistant/quizzes', label: 'الاختبارات', icon: Sparkles },
  { to: '/assistant/payments', label: 'الاشتراكات', icon: Wallet },
  { to: '/assistant/weekly-report', label: 'التقرير الأسبوعي', icon: FileBarChart },
  { to: '/assistant/grades', label: 'الدرجات', icon: Award },
  { to: '/assistant/announcements', label: 'الإعلانات', icon: Megaphone },
  { to: '/assistant/groups', label: 'المجموعات', icon: Layers },
  { to: '/assistant/profile', label: 'الملف الشخصي', icon: User },
  { to: '/assistant/settings', label: 'الإعدادات', icon: Settings },
]

const titles: Record<string, string> = {
  '/assistant': 'لوحة التحكم',
  '/assistant/students': 'إدارة الطلاب',
  '/assistant/contacts': 'جهات الاتصال',
  '/assistant/attendance': 'الحضور والغياب',
  '/assistant/lessons': 'الحصص الدراسية',
  '/assistant/homework': 'الواجبات',
  '/assistant/quizzes': 'الاختبارات',
  '/assistant/payments': 'متابعة الاشتراك الشهري',
  '/assistant/weekly-report': 'التقرير الأسبوعي',
  '/assistant/grades': 'الدرجات',
  '/assistant/announcements': 'الإعلانات',
  '/assistant/groups': 'المجموعات',
  '/assistant/profile': 'الملف الشخصي',
  '/assistant/settings': 'الإعدادات',
}

export function AssistantLayout() {
  const location = useLocation()
  const title = titles[location.pathname] || 'منارة'

  return (
    <DashboardLayout items={items} title={title}>
      <Outlet />
    </DashboardLayout>
  )
}