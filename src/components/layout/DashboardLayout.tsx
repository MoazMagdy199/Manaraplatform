import { useState, type ReactNode } from 'react'
import { Sidebar, type NavItem } from './Sidebar'
import { Topbar } from './Topbar'

export function DashboardLayout({
  items,
  title,
  children,
}: {
  items: NavItem[]
  title: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-[var(--color-paper)] dark:bg-[var(--color-dark-bg)]">
      <Sidebar items={items} open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onMenuClick={() => setOpen(true)} title={title} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
