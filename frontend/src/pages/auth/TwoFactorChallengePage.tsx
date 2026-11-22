import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../features/auth/authApi'
import { CodeInput } from '../../features/auth/components/CodeInput'
import { errorMessage } from '../../features/auth/errors'
import { useSetMe } from '../../features/auth/useAuth'
import { AuthLayout } from '../../layouts/AuthLayout'
import { ApiError } from '../../lib/api'
import { ROUTES } from '../../routes'

const linkClass = 'text-text font-semibold underline underline-offset-2'

/** Second step of an e-mail/password sign-in when 2FA is on: app code or a recovery code. */
export function TwoFactorChallengePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const setMe = useSetMe()
  const from = (location.state as { from?: string } | null)?.from

  const [useRecovery, setUseRecovery] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const lastSubmitted = useRef<string | null>(null)

  const submit = async (value: string) => {
    if (!value.trim() || submitting) return
    lastSubmitted.current = value
    setSubmitting(true)
    setError(null)
    try {
      const user = await authApi.twoFactorChallenge(value)
      setMe(user)
      navigate(from ?? ROUTES.today, { replace: true })
    } catch (e) {
      if (e instanceof ApiError && e.code === 'two_factor_expired') setExpired(true)
      setError(e instanceof ApiError && e.field('code') ? e.field('code')! : errorMessage(e, t))
      setSubmitting(false)
    }
  }

  const onCodeChange = (value: string) => {
    setCode(value)
    if (value.length === 6 && value !== lastSubmitted.current) void submit(value)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void submit(code)
  }

  const toggleMode = () => {
    setUseRecovery((v) => !v)
    setCode('')
    setError(null)
    lastSubmitted.current = null
  }

  if (expired) {
    return (
      <AuthLayout title={t('auth.twoFactor.title')}>
        <Alert tone="warning">{error}</Alert>
        <Link to={ROUTES.signIn} replace className={linkClass}>
          {t('auth.twoFactor.backToSignIn')}
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={t('auth.twoFactor.title')}
      subtitle={useRecovery ? t('auth.twoFactor.recoverySubtitle') : t('auth.twoFactor.subtitle')}
      footer={
        <Link to={ROUTES.signIn} replace className={linkClass}>
          {t('auth.twoFactor.backToSignIn')}
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        {error && <Alert tone="error">{error}</Alert>}
        {useRecovery ? (
          <Input
            key="recovery"
            label={t('auth.twoFactor.recoveryLabel')}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        ) : (
          <label className="grid gap-2">
            <span className="font-semibold">{t('auth.twoFactor.codeLabel')}</span>
            <CodeInput key="totp" value={code} onChange={onCodeChange} invalid={!!error} autoFocus />
          </label>
        )}
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          {t('auth.twoFactor.submit')}
        </Button>
        <button
          type="button"
          onClick={toggleMode}
          className="text-muted hover:text-text h-11 text-sm font-semibold"
        >
          {useRecovery ? t('auth.twoFactor.useApp') : t('auth.twoFactor.useRecovery')}
        </button>
      </form>
    </AuthLayout>
  )
}
