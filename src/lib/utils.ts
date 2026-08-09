import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function initials(name: string) {
  return name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
}

export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(d)
}

export function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'الآن'
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `منذ ${days} يوم`
  const months = Math.floor(days / 30)
  return `منذ ${months} شهر`
}
