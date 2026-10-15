import { Menu, Sun, Moon, LogOut, User as UserIcon, Settings as SettingsIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { initials } from '@/lib/utils'

export function Topbar({ onMenuClick, title }: { onMenuClick: () => void; title: string }) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  if (!user) return null

const base = 
  user.role === 'Teacher' ? '/teacher' : 
  user.role === 'Assistant' ? '/assistant' : 
  '/student'
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-black/5 bg-[var(--color-paper-raised)]/85 backdrop-blur px-4 sm:px-6 dark:bg-[var(--color-dark-surface)]/85 dark:border-[var(--color-dark-border)]">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-bold hidden sm:block">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="تبديل المظهر">
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-xl p-1 pl-2 hover:bg-black/5 dark:hover:bg-white/10">
              <span className="hidden sm:block text-sm font-semibold">{user.name}</span>
              <Avatar>
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => navigate(`${base}/profile`)}>
              <UserIcon className="h-4 w-4" /> الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`${base}/settings`)}>
              <SettingsIcon className="h-4 w-4" /> الإعدادات
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="text-[var(--color-rose-500)]"
            >
              <LogOut className="h-4 w-4" /> تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
