import { Loader2 } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/** Title + intro of an admin page (also sets the tab title). */
export function AdminPage({
  title,
  intro,
  children,
}: {
  title: string
  intro?: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  useEffect(() => {
    document.title = `${title} · ${t('admin.title')} · ${t('app.name')}`
  }, [title, t])

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <header className="grid gap-1">
        <p className="text-primary text-xs font-semibold tracking-wider uppercase">{t('admin.title')}</p>
        <h1 className="text-4xl font-extrabold uppercase italic">{title}</h1>
        {intro && <p className="text-muted">{intro}</p>}
      </header>
      {children}
    </div>
  )
}

export function Loading() {
  const { t } = useTranslation()
  return (
    <div role="status" className="grid place-items-center py-16">
      <Loader2 className="text-primary size-8 animate-spin" aria-hidden />
      <span className="sr-only">{t('appPages.loading')}</span>
    </div>
  )
}

/** Small status label (admin, e-mail not confirmed, inactive…). */
export function Badge({ children, muted = false }: { children: string; muted?: boolean }) {
  return (
    <span
      className={
        muted
          ? 'bg-surface-2 text-muted rounded-md px-2 py-0.5 text-xs font-semibold'
          : 'bg-primary/12 text-primary rounded-md px-2 py-0.5 text-xs font-semibold'
      }
    >
      {children}
    </span>
  )
}
