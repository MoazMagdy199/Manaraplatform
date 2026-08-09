import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[100px] w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-[var(--color-ink-soft)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/40 focus-visible:border-[var(--color-brand-500)] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--color-dark-surface-2)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-ink)]',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Textarea }
