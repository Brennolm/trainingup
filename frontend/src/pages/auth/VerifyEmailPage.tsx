import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { authApi } from '../../features/auth/authApi'
import { CodeInput } from '../../features/auth/components/CodeInput'
import { errorMessage } from '../../features/auth/errors'
import { ME_QUERY_KEY, useMe, useSetMe } from '../../features/auth/useAuth'
import { AuthLayout } from '../../layouts/AuthLayout'
import { ApiError } from '../../lib/api'
import { ROUTES } from '../../routes'

const RESEND_SECONDS = 60

export function VerifyEmailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const setMe = useSetMe()
  const { data: user } = useMe()
  const emailSent = (location.state as { emailSent?: boolean } | null)?.emailSent

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(
    emailSent === false ? t('auth.verify.sendFailed') : null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  // A code was just sent at sign-up (or on arrival from sign-in we don't know): start the timer.
  const [cooldown, setCooldown] = useState(RESEND_SECONDS)
  const lastSubmitted = useRef<string | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  const submit = async (value: string) => {
    if (value.length !== 6 || submitting) return
    lastSubmitted.current = value
    setSubmitting(true)
    setError(null)
    try {
      const verified = await authApi.verifyEmail(value)
      setMe(verified)
      navigate(ROUTES.today, { replace: true })
    } catch (e) {
      setError(e instanceof ApiError && e.field('code') ? e.field('code')! : errorMessage(e, t))
      setSubmitting(false)
    }
  }

  // Submit automatically once the 6th digit is typed or pasted.
  const onCodeChange = (value: string) => {
    setCode(value)
    if (value.length === 6 && value !== lastSubmitted.current) void submit(value)
  }

  const resend = async () => {
    setResending(true)
    setError(null)
    setNotice(null)
    try {
      const res = await authApi.resendCode()
      setNotice(t('auth.verify.resent'))
      setCooldown(res.retry_after ?? RESEND_SECONDS)
      setCode('')
      lastSubmitted.current = null
    } catch (e) {
      if (e instanceof ApiError && e.retryAfter) setCooldown(e.retryAfter)
      setError(errorMessage(e, t))
    } finally {
      setResending(false)
    }
  }

  const signOut = async () => {
    await authApi.logout().catch(() => undefined)
    // Remove (not null) the cached user: screens still mounted during the transition keep their
    // data, so the auth guard does not redirect to sign-in; the next protected page asks the API.
    await navigate(ROUTES.signUp, { replace: true })
    queryClient.removeQueries({ queryKey: ME_QUERY_KEY })
  }

  if (user?.email_verified) return <Navigate to={ROUTES.today} replace />

  return (
    <AuthLayout
      title={t('auth.verify.title')}
      subtitle={
        <>
          {t('auth.verify.subtitle')} <strong className="text-text break-all">{user?.email}</strong>
        </>
      }
    >
      <form
        noValidate
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          void submit(code)
        }}
      >
        {notice && <Alert tone={emailSent === false && !error ? 'warning' : 'success'}>{notice}</Alert>}
        <div className="grid gap-2">
          <label htmlFor="verification-code" className="text-sm font-medium">
            {t('auth.verify.codeLabel')}
          </label>
          <CodeInput
            id="verification-code"
            value={code}
            onChange={onCodeChange}
            invalid={!!error}
            aria-describedby={error ? 'verification-error' : undefined}
            autoFocus
          />
          {error && (
            <p id="verification-error" role="alert" className="text-danger text-sm">
              {error}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" fullWidth loading={submitting} disabled={code.length !== 6}>
          {t('auth.verify.submit')}
        </Button>
        <Button variant="secondary" fullWidth onClick={resend} loading={resending} disabled={cooldown > 0}>
          {cooldown > 0 ? t('auth.verify.resendIn', { seconds: cooldown }) : t('auth.verify.resend')}
        </Button>
        <div className="text-muted grid gap-1 text-center text-sm">
          <p>{t('auth.verify.spamHint')}</p>
          <p>
            {t('auth.verify.wrongEmail')}{' '}
            <button
              type="button"
              onClick={signOut}
              className="text-text font-semibold underline underline-offset-2"
            >
              {t('auth.verify.signOut')}
            </button>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}
