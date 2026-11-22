import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../features/auth/authApi'
import { AuthDivider, GoogleButton } from '../../features/auth/components/GoogleButton'
import { errorMessage } from '../../features/auth/errors'
import { signInSchema, type SignInValues } from '../../features/auth/schemas'
import { useSetMe } from '../../features/auth/useAuth'
import { AuthLayout } from '../../layouts/AuthLayout'
import { ApiError } from '../../lib/api'
import { ROUTES } from '../../routes'

const linkClass = 'text-text font-semibold underline underline-offset-2'

export function SignInPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const setMe = useSetMe()
  const [formError, setFormError] = useState<string | null>(null)
  const from = (location.state as { from?: string } | null)?.from
  // Errors coming back from the Google flow (?erro=google | google_email).
  const [params] = useSearchParams()
  const googleError = params.get('erro')
  const googleErrorKey = googleError === 'google_email' ? 'google_email' : googleError ? 'google' : null

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '', remember: true },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const user = await authApi.login(values)
      setMe(user)
      navigate(user.email_verified ? (from ?? ROUTES.today) : ROUTES.verifyEmail, { replace: true })
    } catch (error) {
      // Wrong credentials come back as a validation error on "email": show it as one message.
      setFormError(
        error instanceof ApiError && error.field('email') ? error.field('email')! : errorMessage(error, t),
      )
    }
  })

  return (
    <AuthLayout
      title={t('auth.signInPage.title')}
      subtitle={t('auth.signInPage.subtitle')}
      footer={
        <>
          {t('auth.signInPage.noAccount')}{' '}
          <Link to={ROUTES.signUp} className={linkClass}>
            {t('auth.signInPage.createAccount')}
          </Link>
        </>
      }
    >
      {googleErrorKey && !formError && (
        <Alert tone="error">{t(`auth.google.errors.${googleErrorKey}`)}</Alert>
      )}
      <GoogleButton />
      <AuthDivider />
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        {formError && <Alert tone="error">{formError}</Alert>}
        <Input
          label={t('auth.fields.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message && t(errors.email.message)}
          {...register('email')}
        />
        <Input
          label={t('auth.fields.password')}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message && t(errors.password.message)}
          {...register('password')}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Checkbox label={t('auth.signInPage.remember')} {...register('remember')} />
          <Link to={ROUTES.forgotPassword} className="text-muted hover:text-text py-2 text-sm font-semibold">
            {t('auth.signInPage.forgot')}
          </Link>
        </div>
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {t('auth.signInPage.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
