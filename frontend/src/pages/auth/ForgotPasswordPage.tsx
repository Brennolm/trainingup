import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../features/auth/authApi'
import { errorMessage } from '../../features/auth/errors'
import { forgotPasswordSchema, type ForgotPasswordValues } from '../../features/auth/schemas'
import { AuthLayout } from '../../layouts/AuthLayout'
import { ROUTES } from '../../routes'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [sentMessage, setSentMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null)
    try {
      const res = await authApi.forgotPassword(email)
      setSentMessage(res.message)
    } catch (error) {
      setFormError(errorMessage(error, t))
    }
  })

  if (sentMessage) {
    return (
      <AuthLayout title={t('auth.forgot.sentTitle')}>
        <Alert tone="success">{sentMessage}</Alert>
        <p className="text-muted text-sm">{t('auth.verify.spamHint')}</p>
        <ButtonLink to={ROUTES.signIn} variant="secondary" size="lg" fullWidth>
          {t('auth.forgot.backToSignIn')}
        </ButtonLink>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={t('auth.forgot.title')}
      subtitle={t('auth.forgot.subtitle')}
      footer={
        <Link to={ROUTES.signIn} className="text-text font-semibold underline underline-offset-2">
          {t('auth.forgot.backToSignIn')}
        </Link>
      }
    >
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
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {t('auth.forgot.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
