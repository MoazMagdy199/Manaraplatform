import { Sun, Moon, Monitor } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import { NotificationSettings } from '@/components/shared/NotificationSettings'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  const options = [
    { key: 'light' as const, label: 'الوضع الفاتح', icon: Sun, desc: 'مظهر فاتح ومريح للعين نهاراً' },
    { key: 'dark' as const, label: 'الوضع الداكن', icon: Moon, desc: 'مظهر داكن مناسب للاستخدام الليلي' },
  ]

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">الإعدادات</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          تخصيص مظهر المنصة
        </p>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <Monitor className="h-5 w-5 text-[var(--color-brand-500)]" />
            <h3 className="font-display font-bold text-lg">مظهر الواجهة</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTheme(opt.key)}
                className={cn(
                  'text-right rounded-2xl border-2 p-5 transition-colors',
                  theme === opt.key
                    ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/30'
                    : 'border-black/10 hover:bg-black/[0.02] dark:border-[var(--color-dark-border)] dark:hover:bg-white/5',
                )}
              >
                <div
                  className={cn(
                    'h-11 w-11 rounded-xl flex items-center justify-center mb-3',
                    theme === opt.key ? 'bg-[var(--color-brand-500)] text-white' : 'bg-black/5 dark:bg-white/10',
                  )}
                >
                  <opt.icon className="h-5 w-5" />
                </div>
                <p className="font-semibold">{opt.label}</p>
                <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1">
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <NotificationSettings />
    </div>
  )
}