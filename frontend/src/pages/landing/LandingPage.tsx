import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  Dumbbell,
  Salad,
  Scale,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Logo } from '../../components/brand/Logo'
import { Button } from '../../components/ui/Button'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { cn } from '../../lib/cn'
import { useInstallPrompt } from '../../lib/useInstallPrompt'
import { ROUTES } from '../../routes'
import { LandingHeader } from './LandingHeader'
import { PhoneMockup } from './PhoneMockup'
import { SECTION_IDS } from './sectionIds'

const CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-6'
const CURRENT_YEAR = new Date().getFullYear()

function SectionHeading({ title, subtitle, id }: { title: string; subtitle?: string; id?: string }) {
  return (
    <div className="grid max-w-2xl gap-3">
      <h2 id={id} className="text-4xl leading-none font-extrabold uppercase italic sm:text-5xl">
        {title}
      </h2>
      {subtitle && <p className="text-muted text-lg">{subtitle}</p>}
    </div>
  )
}

// Decorative rising chevrons, echoing the logo.
function Chevrons({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g transform="skewX(-10) translate(6 0)">
        <path
          d="M10 56 L32 36 L54 56"
          fill="none"
          stroke="var(--secondary)"
          strokeWidth="9"
          strokeLinecap="square"
        />
        <path
          d="M10 34 L32 14 L54 34"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="9"
          strokeLinecap="square"
        />
      </g>
    </svg>
  )
}

function Hero() {
  const { t } = useTranslation()
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden pt-[calc(6.5rem+env(safe-area-inset-top))] pb-16 sm:pb-24"
    >
      <Chevrons className="pointer-events-none absolute -top-10 -right-24 size-[34rem] opacity-[0.06] sm:-right-10" />
      <div className={cn(CONTAINER, 'grid items-center gap-14 lg:grid-cols-[1.15fr_1fr]')}>
        <div className="grid gap-6">
          <span className="bg-primary/12 text-primary w-fit rounded-full px-3 py-1 text-sm font-semibold">
            {t('landing.hero.beta')}
          </span>
          <h1
            id="hero-title"
            className="text-[3.25rem] leading-[0.92] font-extrabold uppercase italic sm:text-7xl lg:text-[5.25rem]"
          >
            {t('landing.hero.titleStart')} <span className="text-primary">{t('landing.hero.titleEnd')}</span>
          </h1>
          <p className="text-muted max-w-[46ch] text-lg sm:text-xl">{t('landing.hero.subtitle')}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink to={ROUTES.signUp} size="lg">
              {t('landing.hero.cta')}
              <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
            <a
              href={`#${SECTION_IDS.howItWorks}`}
              className={cn(
                'text-muted hover:text-text h-14 px-2 font-semibold',
                'inline-flex items-center justify-center',
              )}
            >
              {t('landing.hero.secondary')}
            </a>
          </div>
          <p className="text-muted text-sm">{t('landing.hero.note')}</p>
        </div>
        <div className="relative flex justify-center">
          <div
            aria-hidden
            className="bg-primary/25 absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          />
          <PhoneMockup className="relative rotate-[-3deg]" />
        </div>
      </div>
    </section>
  )
}

function ProductCard({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: LucideIcon
  title: string
  items: string[]
  tone: 'primary' | 'secondary'
}) {
  return (
    <div className="bg-surface ring-border grid content-start gap-5 rounded-3xl p-6 ring-1 sm:p-8">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'grid size-12 place-items-center rounded-2xl',
            tone === 'primary' ? 'bg-primary/12 text-primary' : 'bg-secondary/15 text-secondary',
          )}
        >
          <Icon className="size-6" aria-hidden />
        </span>
        <h3 className="text-3xl font-extrabold uppercase italic">{title}</h3>
      </div>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <Check
              className={cn('mt-0.5 size-5 shrink-0', tone === 'primary' ? 'text-primary' : 'text-secondary')}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Products() {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="products-title" className="py-16 sm:py-24">
      <div className={cn(CONTAINER, 'grid gap-10')}>
        <SectionHeading
          id="products-title"
          title={t('landing.products.title')}
          subtitle={t('landing.products.subtitle')}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <ProductCard
            icon={Dumbbell}
            tone="primary"
            title={t('landing.products.workout.title')}
            items={[
              t('landing.products.workout.item1'),
              t('landing.products.workout.item2'),
              t('landing.products.workout.item3'),
            ]}
          />
          <ProductCard
            icon={Salad}
            tone="secondary"
            title={t('landing.products.diet.title')}
            items={[
              t('landing.products.diet.item1'),
              t('landing.products.diet.item2'),
              t('landing.products.diet.item3'),
            ]}
          />
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const { t } = useTranslation()
  const steps = [1, 2, 3].map((n) => ({
    n,
    title: t(`landing.how.step${n}.title`),
    text: t(`landing.how.step${n}.text`),
  }))
  return (
    <section
      id={SECTION_IDS.howItWorks}
      aria-labelledby="how-title"
      className="bg-surface scroll-mt-16 py-16 sm:py-24"
    >
      <div className={cn(CONTAINER, 'grid gap-10')}>
        <SectionHeading id="how-title" title={t('landing.how.title')} />
        <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((s) => (
            <li key={s.n} className="grid content-start gap-3">
              <span
                className="font-display text-primary text-6xl leading-none font-extrabold italic"
                aria-label={t('landing.how.stepLabel', { n: s.n })}
              >
                {String(s.n).padStart(2, '0')}
              </span>
              <h3 className="text-2xl font-extrabold uppercase italic">{s.title}</h3>
              <p className="text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const FEATURES: { key: string; icon: LucideIcon }[] = [
  { key: 'generated', icon: Dumbbell },
  { key: 'offline', icon: WifiOff },
  { key: 'progression', icon: TrendingUp },
  { key: 'swaps', icon: ArrowLeftRight },
  { key: 'shopping', icon: ShoppingCart },
  { key: 'body', icon: Scale },
]

function Features() {
  const { t } = useTranslation()
  return (
    <section
      id={SECTION_IDS.features}
      aria-labelledby="features-title"
      className="scroll-mt-16 py-16 sm:py-24"
    >
      <div className={cn(CONTAINER, 'grid gap-10')}>
        <SectionHeading
          id="features-title"
          title={t('landing.features.title')}
          subtitle={t('landing.features.subtitle')}
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ key, icon: Icon }) => (
            <li key={key} className="bg-surface ring-border grid content-start gap-3 rounded-3xl p-6 ring-1">
              <Icon className="text-primary size-7" aria-hidden />
              <h3 className="text-xl font-extrabold uppercase italic">
                {t(`landing.features.${key}.title`)}
              </h3>
              <p className="text-muted">{t(`landing.features.${key}.text`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function InstallSteps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="bg-bg ring-border grid content-start gap-4 rounded-3xl p-6 ring-1">
      <h3 className="flex items-center gap-2 text-2xl font-extrabold uppercase italic">
        <Smartphone className="text-primary size-6" aria-hidden />
        {title}
      </h3>
      <ol className="grid gap-3">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="bg-surface-2 grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold">
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function InstallApp() {
  const { t } = useTranslation()
  const { canInstall, installed, install } = useInstallPrompt()
  return (
    <section aria-labelledby="install-title" className="bg-surface py-16 sm:py-24">
      <div className={cn(CONTAINER, 'grid gap-10')}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            id="install-title"
            title={t('landing.install.title')}
            subtitle={t('landing.install.subtitle')}
          />
          {installed ? (
            <p className="text-success font-semibold" role="status">
              {t('landing.install.installed')}
            </p>
          ) : (
            canInstall && (
              <Button size="lg" onClick={install} className="shrink-0">
                <Download className="size-5" aria-hidden />
                {t('landing.install.button')}
              </Button>
            )
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <InstallSteps
            title={t('landing.install.iphone.title')}
            steps={[
              t('landing.install.iphone.step1'),
              t('landing.install.iphone.step2'),
              t('landing.install.iphone.step3'),
            ]}
          />
          <InstallSteps
            title={t('landing.install.android.title')}
            steps={[
              t('landing.install.android.step1'),
              t('landing.install.android.step2'),
              t('landing.install.android.step3'),
            ]}
          />
        </div>
      </div>
    </section>
  )
}

const FAQ_KEYS = ['free', 'professional', 'offline', 'data', 'custom'] as const

function Faq() {
  const { t } = useTranslation()
  return (
    <section id={SECTION_IDS.faq} aria-labelledby="faq-title" className="scroll-mt-16 py-16 sm:py-24">
      <div className={cn(CONTAINER, 'grid max-w-3xl gap-10')}>
        <SectionHeading id="faq-title" title={t('landing.faq.title')} />
        <div className="divide-border border-border divide-y border-y">
          {FAQ_KEYS.map((key) => (
            <details key={key} className="group">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {t(`landing.faq.${key}.q`)}
                <ChevronDown
                  className="text-muted size-5 shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="text-muted grid gap-2 pb-5">
                <p>{t(`landing.faq.${key}.a`)}</p>
                {key === 'data' && (
                  <Link
                    to={ROUTES.privacy}
                    className="text-text w-fit font-semibold underline underline-offset-2"
                  >
                    {t('landing.faq.data.link')}
                  </Link>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="final-title" className="pb-16 sm:pb-24">
      <div className={CONTAINER}>
        <div className="bg-primary text-on-primary relative grid gap-6 overflow-hidden rounded-[2rem] px-6 py-12 sm:px-12 sm:py-16">
          <Chevrons className="pointer-events-none absolute -right-10 -bottom-16 size-80 opacity-20 mix-blend-multiply" />
          <h2
            id="final-title"
            className="relative text-5xl leading-none font-extrabold uppercase italic sm:text-6xl"
          >
            {t('landing.finalCta.title')}
          </h2>
          <p className="relative max-w-[42ch] text-lg font-medium opacity-90">{t('landing.finalCta.text')}</p>
          <ButtonLink to={ROUTES.signUp} size="lg" variant="inverse" className="relative w-fit">
            {t('landing.finalCta.button')}
            <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-muted hover:text-text font-medium">
      {children}
    </Link>
  )
}

function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="border-border border-t pt-10 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className={cn(CONTAINER, 'grid gap-8')}>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Logo />
          <nav aria-label={t('landing.footer.legalNav')}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              <li>
                <FooterLink to={ROUTES.terms}>{t('legal.terms')}</FooterLink>
              </li>
              <li>
                <FooterLink to={ROUTES.privacy}>{t('legal.privacy')}</FooterLink>
              </li>
              <li>
                <FooterLink to={ROUTES.cookies}>{t('legal.cookies')}</FooterLink>
              </li>
            </ul>
          </nav>
        </div>
        <div className="text-muted flex flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
          <p className="max-w-[60ch]">{t('legal.disclaimer')}</p>
          <ThemeToggle />
        </div>
        <div className="text-muted flex flex-col gap-1 text-sm sm:flex-row sm:gap-6">
          <p>
            {t('contact.label')}: <span className="text-text select-all">{t('contact.email')}</span>
          </p>
          <p>{t('landing.footer.rights', { year: CURRENT_YEAR })}</p>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = t('landing.meta.title')
  }, [t])
  return (
    <>
      <a
        href="#conteudo"
        className="bg-primary text-on-primary sr-only z-50 rounded-xl px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('landing.skipToContent')}
      </a>
      <LandingHeader />
      <main id="conteudo">
        <Hero />
        <Products />
        <HowItWorks />
        <Features />
        <InstallApp />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
