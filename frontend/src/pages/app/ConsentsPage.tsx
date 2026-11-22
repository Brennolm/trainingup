import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { authApi } from '../../features/auth/authApi'
import { errorMessage } from '../../features/auth/errors'
import { ROUTES } from '../../routes'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** Profile → Privacidade → Meus consentimentos (LGPD: what was accepted, when and which version). */
export function ConsentsPage() {
  const { t } = useTranslation()
  const consents = useQuery({ queryKey: ['consents'], queryFn: authApi.consents })

  useEffect(() => {
    document.title = `${t('privacy.consentsPage.title')} · ${t('app.name')}`
  }, [t])

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <Link
        to={ROUTES.profile}
        className="text-muted hover:text-text flex h-11 w-fit items-center gap-2 font-semibold"
      >
        <ArrowLeft className="size-5" aria-hidden />
        {t('privacy.consentsPage.back')}
      </Link>
      <div className="grid gap-2">
        <h1 className="text-4xl font-extrabold uppercase italic">{t('privacy.consentsPage.title')}</h1>
        <p className="text-muted">{t('privacy.consentsPage.subtitle')}</p>
      </div>

      {consents.isPending && (
        <div role="status" className="grid place-items-center py-10">
          <Loader2 className="text-primary size-8 animate-spin" aria-hidden />
          <span className="sr-only">{t('appPages.loading')}</span>
        </div>
      )}
      {consents.isError && <Alert tone="error">{errorMessage(consents.error, t)}</Alert>}
      {consents.data?.length === 0 && <p className="text-muted">{t('privacy.consentsPage.empty')}</p>}

      {consents.data && consents.data.length > 0 && (
        <ul className="grid gap-3" aria-label={t('privacy.consentsPage.title')}>
          {consents.data.map((c, i) => (
            <li key={`${c.type}-${c.accepted_at}-${i}`}>
              <Card className="grid gap-1">
                <span className="font-semibold">{t(`privacy.consentsPage.types.${c.type}`)}</span>
                <span className="text-muted text-sm">
                  {t('privacy.consentsPage.version', { version: c.version })} ·{' '}
                  {t('privacy.consentsPage.acceptedAt', { date: dateFormat.format(new Date(c.accepted_at)) })}
                  {c.ip_address && <> · {t('privacy.consentsPage.ip', { ip: c.ip_address })}</>}
                </span>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted text-sm">{t('privacy.consentsPage.revoke', { email: t('contact.email') })}</p>
    </div>
  )
}
