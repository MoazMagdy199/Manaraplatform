import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Toast {
  id: number
  title: string
  description?: string
  variant: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 4000)
  }, [])

  const remove = (id: number) => setToasts((prev) => prev.filter((x) => x.id !== id))

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-rose-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-indigo-500 shrink-0" />,
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[100] flex flex-col gap-2 w-[92vw] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border border-black/5 bg-[var(--color-paper-raised)] p-4 shadow-xl animate-in slide-in-from-bottom-4 fade-in dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]',
            )}
          >
            {icons[t.variant]}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && (
                <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-0.5">
                  {t.description}
                </p>
              )}
            </div>
            <button onClick={() => remove(t.id)} className="opacity-50 hover:opacity-100 shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
