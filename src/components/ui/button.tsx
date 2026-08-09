import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-brand-500)] text-white shadow-sm hover:bg-[var(--color-brand-600)]',
        amber: 'bg-[var(--color-amber-500)] text-[var(--color-ink)] shadow-sm hover:bg-[var(--color-amber-600)]',
        outline:
          'border border-[var(--color-brand-500)]/30 bg-transparent text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] dark:text-[var(--color-brand-300)] dark:border-[var(--color-dark-border)] dark:hover:bg-[var(--color-dark-surface-2)]',
        ghost:
          'bg-transparent hover:bg-[var(--color-brand-50)] text-[var(--color-ink)] dark:text-[var(--color-dark-ink)] dark:hover:bg-[var(--color-dark-surface-2)]',
        destructive: 'bg-[var(--color-rose-500)] text-white hover:opacity-90',
        link: 'text-[var(--color-brand-600)] underline-offset-4 hover:underline dark:text-[var(--color-brand-300)]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
