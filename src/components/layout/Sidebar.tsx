import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export function Sidebar({
  items,
  open,
  onClose,
}: {
  items: NavItem[]
  open: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* mobile backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-64 shrink-0 border-l border-black/5 bg-[var(--color-paper-raised)] transition-transform duration-300 lg:static lg:translate-x-0 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]',
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-6 border-b border-black/5 dark:border-[var(--color-dark-border)]">
          <svg width="28" height="28" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="var(--color-brand-500)" />
            <path d="M32 10 L38 26 L54 32 L38 38 L32 54 L26 38 L10 32 L26 26 Z" fill="var(--color-amber-500)" />
          </svg>
          <span className="font-display text-lg font-extrabold">منارة</span>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-[var(--color-brand-500)] text-white shadow-sm'
                    : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-ink)] dark:text-[var(--color-dark-ink-soft)] dark:hover:bg-[var(--color-dark-surface-2)] dark:hover:text-[var(--color-dark-ink)]',
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
