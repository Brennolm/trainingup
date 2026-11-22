import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../features/auth/authApi'
import { PasswordRules } from '../../features/auth/components/PasswordRules'
import { applyFieldErrors, errorMessage } from '../../features/auth/errors'
import { resetPasswordSchema, type ResetPasswordValues } from '../../features/auth/schemas'
import { AuthLayout } from '../../layouts/AuthLayout'
import { ApiError } from '../../lib/api'
import { ROUTES } from '../../routes'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''
  const [doneMessage, setDoneMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', password_confirmation: '' },
  })
  const password = useWatch({ control, name: 'password' })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const res = await authApi.resetPassword({ ...values, token, email })
      setDoneMessage(res.message)
    } catch (error) {
      if (error instanceof ApiError && (error.field('token') || error.field('email'))) {
        setFormError(error.field('token') ?? error.field('email')!)
      } else if (!applyFieldErrors(error, setError, ['password', 'password_confirmation'])) {
        setFormError(errorMessage(error, t))
      }
    }
  })

  if (!token || !email) {
    return (
      <AuthLayout title={t('auth.reset.title')}>
        <Alert tone="error">{t('auth.reset.invalidLink')}</Alert>
        <ButtonLink to={ROUTES.forgotPassword} size="lg" fullWidth>
          {t('auth.reset.requestNew')}
        </ButtonLink>
      </AuthLayout>
    )
  }

  if (doneMessage) {
    return (
      <AuthLayout title={t('auth.reset.doneTitle')}>
        <Alert tone="success">{doneMessage}</Alert>
        <ButtonLink to={ROUTES.signIn} size="lg" fullWidth>
          {t('auth.reset.goToSignIn')}
        </ButtonLink>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t('auth.reset.title')} subtitle={t('auth.reset.subtitle')}>
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        {formError && (
          <Alert tone="error">
            {formError}{' '}
            <Link to={ROUTES.forgotPassword} className="font-semibold underline underline-offset-2">
              {t('auth.reset.requestNew')}
            </Link>
          </Alert>
        )}
        <div className="grid gap-3">
          <Input
            label={t('auth.fields.newPassword')}
            type="password"
            autoComplete="new-password"
            error={errors.password?.message && t(errors.password.message)}
            aria-describedby="reset-password-rules"
            {...register('password')}
          />
          <PasswordRules id="reset-password-rules" value={password} />
        </div>
        <Input
          label={t('auth.fields.passwordConfirmation')}
          type="password"
          autoComplete="new-password"
          error={errors.password_confirmation?.message && t(errors.password_confirmation.message)}
          {...register('password_confirmation')}
        />
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {t('auth.reset.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
