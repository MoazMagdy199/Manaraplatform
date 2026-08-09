import * as React from 'react'
import { cn } from '@/lib/utils'

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium leading-none mb-1.5 block text-[var(--color-ink)] dark:text-[var(--color-dark-ink)]', className)}
      {...props}
    />
  ),
)
Label.displayName = 'Label'

export { Label }
