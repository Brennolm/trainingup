import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Logo } from '../components/brand/Logo'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { ROUTES } from '../routes'

type Props = { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }

/** Shared frame for sign-in, sign-up, verification and password pages (mobile-first). */
export function AuthLayout({ title, subtitle, children, footer }: Props) {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = `${title} · ${t('app.name')}`
  }, [title, t])

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-8">
      <header className="flex items-center justify-between">
        <Link to={ROUTES.home} className="rounded-lg" aria-label={t('auth.backHome')}>
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto grid w-full max-w-md flex-1 content-center gap-8 py-10">
        <div className="grid gap-2">
          <h1 className="text-5xl leading-none font-extrabold uppercase italic">{title}</h1>
          {subtitle && <p className="text-muted text-lg">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="text-muted text-center">{footer}</div>}
      </main>
    </div>
  )
}
