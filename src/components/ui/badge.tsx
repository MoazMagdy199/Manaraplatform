import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', {
  variants: {
    variant: {
      default: 'bg-[var(--color-brand-50)] text-[var(--color-brand-700)] dark:bg-[var(--color-brand-900)]/40 dark:text-[var(--color-brand-300)]',
      amber: 'bg-[var(--color-amber-100)] text-[var(--color-amber-600)]',
      indigo: 'bg-[var(--color-indigo-300)]/25 text-[var(--color-indigo-600)] dark:text-[var(--color-indigo-300)]',
      rose: 'bg-[var(--color-rose-100)] text-[var(--color-rose-500)]',
      outline: 'border border-black/10 text-[var(--color-ink-soft)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-ink-soft)]',
      success: 'bg-emerald-100 text-emerald-700',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
