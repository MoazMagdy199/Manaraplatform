import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types'

function getRolePath(role: Role): string {
  if (role === 'Teacher') return '/teacher'
  if (role === 'Assistant') return '/assistant'
  return '/student'
}

export function ProtectedRoute({ 
  children, 
  role 
}: { 
  children: ReactNode
  role?: Role | Role[] 
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-paper)] dark:bg-[var(--color-dark-bg)]">
        <div className="h-10 w-10 rounded-full border-4 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)] animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role]
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to={getRolePath(user.role)} replace />
    }
  }

  return <>{children}</>
}