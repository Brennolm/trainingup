import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Logo } from '../components/brand/Logo'
import { ButtonLink } from '../components/ui/ButtonLink'
import { ROUTES } from '../routes'

// Placeholder for pages of later phases (sign-in/up: phase 2; legal pages: phase 3).
export function ComingSoonPage() {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = `${t('comingSoon.title')} · ${t('app.name')}`
  }, [t])

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-8">
      <header>
        <Link to={ROUTES.home} className="inline-block rounded-lg">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto grid w-full max-w-xl flex-1 content-center gap-5 py-16">
        <h1 className="text-6xl leading-none font-extrabold uppercase italic">{t('comingSoon.title')}</h1>
        <p className="text-muted text-lg">{t('comingSoon.text')}</p>
        <ButtonLink to={ROUTES.home} variant="secondary" className="w-fit">
          <ArrowLeft className="size-5" aria-hidden />
          {t('comingSoon.back')}
        </ButtonLink>
      </main>
    </div>
  )
}
