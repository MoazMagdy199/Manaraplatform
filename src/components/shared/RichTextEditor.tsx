import { useRef, useEffect } from 'react'
import { Bold, Italic, List, ListOrdered, Heading2, Underline } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function exec(cmd: string, arg?: string) {
    document.execCommand(cmd, false, arg)
    ref.current?.focus()
    onChange(ref.current?.innerHTML || '')
  }

  const tools = [
    { icon: Bold, cmd: 'bold', label: 'عريض' },
    { icon: Italic, cmd: 'italic', label: 'مائل' },
    { icon: Underline, cmd: 'underline', label: 'تسطير' },
    { icon: Heading2, cmd: 'formatBlock', arg: 'H3', label: 'عنوان' },
    { icon: List, cmd: 'insertUnorderedList', label: 'قائمة نقطية' },
    { icon: ListOrdered, cmd: 'insertOrderedList', label: 'قائمة مرقمة' },
  ]

  return (
    <div className="rounded-xl border border-black/10 dark:border-[var(--color-dark-border)] overflow-hidden">
      <div className="flex items-center gap-1 border-b border-black/10 dark:border-[var(--color-dark-border)] bg-black/[0.02] dark:bg-white/5 p-1.5">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            onClick={() => exec(t.cmd, t.arg)}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]"
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={() => onChange(ref.current?.innerHTML || '')}
        data-placeholder={placeholder}
        className={cn(
          'min-h-[160px] max-h-[340px] overflow-y-auto p-4 text-sm leading-relaxed focus:outline-none prose-sm',
          '[&_h3]:font-display [&_h3]:font-bold [&_h3]:text-base [&_h3]:mt-2 [&_h3]:mb-1',
          '[&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--color-ink-soft)]/50',
        )}
      />
    </div>
  )
}
