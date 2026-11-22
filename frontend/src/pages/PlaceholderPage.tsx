import { useTranslation } from 'react-i18next'
import { Logo } from '../components/brand/Logo'
import { ThemeToggle } from '../components/ui/ThemeToggle'

// Temporary production page until the landing page (phase 1).
export function PlaceholderPage() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-8">
      <header className="flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>
      <section className="mx-auto grid w-full max-w-xl flex-1 content-center gap-5 py-16">
        <span className="bg-primary/12 text-primary w-fit rounded-full px-3 py-1 text-sm font-semibold">
          {t('placeholder.beta')}
        </span>
        <h1 className="text-5xl leading-[0.95] font-extrabold uppercase italic sm:text-6xl">
          {t('placeholder.title')}
        </h1>
        <p className="text-muted max-w-[52ch] text-lg">{t('placeholder.subtitle')}</p>
      </section>
      <footer className="text-muted text-center text-sm">{t('placeholder.disclaimer')}</footer>
    </div>
  )
}
