import { useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { authApi } from '../../features/auth/authApi'
import { errorMessage } from '../../features/auth/errors'
import { ME_QUERY_KEY, useSetMe } from '../../features/auth/useAuth'
import { AuthLayout } from '../../layouts/AuthLayout'
import { ROUTES } from '../../routes'

const linkClass = 'text-text font-semibold underline underline-offset-2'

/** Shown instead of the app when the Terms or Privacy Policy changed since the last acceptance. */
export function LegalUpdatePage() {
  const { t } = useTranslation()
  const setMe = useSetMe()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [accepted, setAccepted] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!accepted) {
      setInvalid(true)
      return
    }
    setBusy(true)
    setError(null)
    try {
      setMe(await authApi.acceptLegal())
    } catch (err) {
      setError(errorMessage(err, t))
      setBusy(false)
    }
  }

  const signOut = async () => {
    await authApi.logout().catch(() => undefined)
    await navigate(ROUTES.home, { replace: true })
    queryClient.removeQueries({ queryKey: ME_QUERY_KEY })
  }

  return (
    <AuthLayout
      title={t('privacy.update.title')}
      subtitle={t('privacy.update.subtitle')}
      footer={
        <button type="button" onClick={signOut} className="h-11 font-semibold underline underline-offset-2">
          {t('privacy.update.signOut')}
        </button>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-5">
        {error && <Alert tone="error">{error}</Alert>}
        <Checkbox
          label={
            <Trans
              i18nKey="auth.signUpPage.acceptLabel"
              components={{
                terms: <Link to={ROUTES.terms} className={linkClass} target="_blank" />,
                privacy: <Link to={ROUTES.privacy} className={linkClass} target="_blank" />,
              }}
            />
          }
          checked={accepted}
          onChange={(e) => {
            setAccepted(e.target.checked)
            setInvalid(false)
          }}
          error={invalid ? t('validation.termsRequired') : undefined}
        />
        <Button type="submit" size="lg" fullWidth loading={busy}>
          {t('privacy.update.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
