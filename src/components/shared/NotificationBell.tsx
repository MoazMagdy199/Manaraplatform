import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])

  const fetchNotifications = async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (data) setNotifications(data)
  }

  useEffect(() => {
    fetchNotifications()

    // الاستماع الفوري للإشعارات الجديدة
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAllAsRead = async () => {
    if (unreadCount === 0) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user?.id)
      .eq('is_read', false)
    
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && markAllAsRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2 font-bold text-sm border-b border-black/5 dark:border-white/10">
          الإشعارات
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-[var(--color-ink-soft)]">لا توجد إشعارات</p>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start p-3 border-b border-black/5 dark:border-white/5 cursor-pointer">
                <p className={`text-sm ${!n.is_read ? 'font-bold' : 'font-medium'}`}>{n.title}</p>
                <p className="text-xs text-[var(--color-ink-soft)] mt-1 line-clamp-2">{n.message}</p>
                <span className="text-[10px] text-[var(--color-brand-500)] mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}