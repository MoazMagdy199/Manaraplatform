import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen,
  ClipboardCheck,
  Trophy,
  Video,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  Star,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Video,
    title: 'حصص تفاعلية',
    desc: 'شروحات فيديو، ملفات PDF، وشرح تفصيلي لكل درس بأسلوب مبسّط وواضح.',
  },
  {
    icon: ClipboardCheck,
    title: 'واجبات وتصحيح فوري',
    desc: 'سلّم واجباتك إلكترونياً واحصل على درجاتك وملاحظات المدرس مباشرة.',
  },
  {
    icon: Sparkles,
    title: 'اختبارات تفاعلية',
    desc: 'اختبر فهمك بعد كل حصة واعرف نتيجتك ومراجعة إجاباتك فوراً.',
  },
  {
    icon: Trophy,
    title: 'نظام إنجازات وتحفيز',
    desc: 'اجمع الأوسمة مع كل إنجاز، وتابع نسبة تقدمك داخل الكورس أولاً بأول.',
  },
]

const stats = [
  { value: '+120', label: 'طالب مسجّل' },
  { value: '+45', label: 'حصة تعليمية' },
  { value: '98%', label: 'نسبة رضا الطلاب' },
]

export default function LandingPage() {
  return (
    <div className="bg-[var(--color-paper)] dark:bg-[var(--color-dark-bg)] text-[var(--color-ink)] dark:text-[var(--color-dark-ink)] overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[var(--color-paper)]/85 backdrop-blur dark:bg-[var(--color-dark-bg)]/85 dark:border-[var(--color-dark-border)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-8 h-16">
          <div className="flex items-center gap-2.5">
            <svg width="30" height="30" viewBox="0 0 64 64">
              <rect width="64" height="64" rx="14" fill="var(--color-brand-500)" />
              <path d="M32 10 L38 26 L54 32 L38 38 L32 54 L26 38 L10 32 L26 26 Z" fill="var(--color-amber-500)" />
            </svg>
            <span className="font-display text-lg font-extrabold">منارة</span>
          </div>
          <Button asChild>
            <Link to="/login">تسجيل الدخول</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 pattern-star opacity-[0.06] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-700)] dark:bg-[var(--color-brand-900)]/40 dark:text-[var(--color-brand-300)] px-3 py-1.5 text-xs font-bold">
                <Star className="h-3.5 w-3.5" /> منصة تعليمية متكاملة
              </span>
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-[1.15] mt-5">
                رحلتك نحو التفوق الدراسي تبدأ من <span className="text-[var(--color-brand-500)]">منارة</span>
              </h1>
              <p className="mt-5 text-lg text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] leading-relaxed max-w-lg">
                كل ما تحتاجه للمذاكرة في مكان واحد: حصص مسجّلة، واجبات، اختبارات تفاعلية، ومتابعة مستمرة لتقدمك — بإشراف مباشر من معلمك.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" asChild>
                  <Link to="/login">
                    ابدأ الآن <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#course">نبذة عن الكورس</a>
                </Button>
              </div>

              <div className="mt-10 flex items-center gap-8">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-2xl font-extrabold text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]">
                      {s.value}
                    </p>
                    <p className="text-xs text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-0.5">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[var(--color-brand-500)]/15 to-[var(--color-amber-500)]/15 blur-2xl" />
              <div className="relative rounded-[1.75rem] border border-black/5 bg-[var(--color-paper-raised)] p-6 shadow-2xl dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
                <div className="flex items-center justify-between mb-5">
                  <p className="font-display font-bold">تقدمك في الكورس</p>
                  <span className="rounded-full bg-[var(--color-amber-100)] text-[var(--color-amber-600)] text-xs font-bold px-2.5 py-1">
                    72%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden mb-6">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-l from-[var(--color-brand-500)] to-[var(--color-brand-300)]" />
                </div>
                <div className="space-y-3">
                  {[
                    { icon: CheckCircle2, text: 'المعادلات التفاضلية', done: true },
                    { icon: CheckCircle2, text: 'قوانين نيوتن للحركة', done: true },
                    { icon: BookOpen, text: 'التفاعلات الكيميائية', done: false },
                  ].map((row) => (
                    <div
                      key={row.text}
                      className="flex items-center gap-3 rounded-xl bg-black/[0.02] dark:bg-white/5 p-3"
                    >
                      <row.icon
                        className={`h-4.5 w-4.5 ${row.done ? 'text-[var(--color-brand-500)]' : 'text-[var(--color-ink-soft)]'}`}
                      />
                      <span className="text-sm font-medium flex-1">{row.text}</span>
                      {row.done && <Badge2 />}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Course + teacher */}
      <section id="course" className="max-w-6xl mx-auto px-5 sm:px-8 py-16 grid md:grid-cols-2 gap-10">
        <div className="rounded-2xl border border-black/5 bg-[var(--color-paper-raised)] p-7 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
          <BookOpen className="h-9 w-9 text-[var(--color-brand-500)]" />
          <h3 className="font-display text-xl font-bold mt-4">نبذة عن الكورس</h3>
          <p className="mt-3 text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] leading-relaxed">
            كورس متكامل يغطي المنهج الدراسي بأسلوب مبسّط، يجمع بين الشرح النظري والتطبيق العملي عبر حصص مصوّرة، ملخصات، وتمارين تدريبية مصمّمة لترسيخ الفهم قبل الانتقال للدرس التالي.
          </p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-[var(--color-paper-raised)] p-7 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
          <GraduationCap className="h-9 w-9 text-[var(--color-amber-500)]" />
          <h3 className="font-display text-xl font-bold mt-4">نبذة عن المدرس</h3>
          <p className="mt-3 text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] leading-relaxed">
  م. معاذ مجدي، مهندس ومعلّم برمجة، مهتم بتبسيط علوم الحاسب والبرمجة للطلاب بأسلوب عملي وتفاعلي، مع التركيز على بناء المهارات خطوة بخطوة وربط الجانب النظري بالتطبيق العملي.
</p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-10 pb-24">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="font-display text-3xl font-extrabold">مميزات الكورس</h2>
          <p className="mt-3 text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
            كل أداة تحتاجها للمذاكرة الفعّالة، مجمّعة في مكان واحد سهل الاستخدام.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-black/5 bg-[var(--color-paper-raised)] p-6 hover:shadow-lg transition-shadow dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]"
            >
              <div className="h-11 w-11 rounded-xl bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/40 flex items-center justify-center">
                <f.icon className="h-5 w-5 text-[var(--color-brand-500)]" />
              </div>
              <h4 className="font-display font-bold mt-4">{f.title}</h4>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[var(--color-brand-700)] text-white">
        <div className="absolute inset-0 pattern-star opacity-[0.1]" />
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-20 text-center relative">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold">جاهز تبدأ رحلتك التعليمية؟</h2>
          <p className="mt-4 text-white/70">سجّل دخولك الآن وابدأ متابعة حصصك وواجباتك في دقائق.</p>
          <Button size="lg" variant="amber" className="mt-8" asChild>
            <Link to="/login">
              تسجيل الدخول <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-black/5 dark:border-[var(--color-dark-border)] py-8 text-center text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
        © {new Date().getFullYear()} منارة التعليمية — جميع الحقوق محفوظة
      </footer>
    </div>
  )
}

function Badge2() {
  return (
    <span className="text-[10px] font-bold bg-[var(--color-brand-50)] text-[var(--color-brand-600)] dark:bg-[var(--color-brand-900)]/40 dark:text-[var(--color-brand-300)] rounded-full px-2 py-0.5">
      مكتمل
    </span>
  )
}
