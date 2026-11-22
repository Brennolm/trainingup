import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../features/auth/authApi'
import { AuthDivider, GoogleButton } from '../../features/auth/components/GoogleButton'
import { PasswordRules } from '../../features/auth/components/PasswordRules'
import { applyFieldErrors, errorMessage } from '../../features/auth/errors'
import { signUpSchema, type SignUpValues } from '../../features/auth/schemas'
import { useSetMe } from '../../features/auth/useAuth'
import { AuthLayout } from '../../layouts/AuthLayout'
import { ROUTES } from '../../routes'

const linkClass = 'text-text font-semibold underline underline-offset-2'

export function SignUpPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setMe = useSetMe()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      birth_date: '',
      accept_terms: false,
    },
  })
  const password = useWatch({ control, name: 'password' })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const { data: user, meta } = await authApi.register(values)
      setMe(user)
      navigate(ROUTES.verifyEmail, { replace: true, state: { emailSent: meta.verification_email_sent } })
    } catch (error) {
      if (!applyFieldErrors(error, setError, ['name', 'email', 'password', 'birth_date', 'accept_terms'])) {
        setFormError(errorMessage(error, t))
      }
    }
  })

  const fieldError = (key?: string) => (key ? t(key) : undefined)

  return (
    <AuthLayout
      title={t('auth.signUpPage.title')}
      subtitle={t('auth.signUpPage.subtitle')}
      footer={
        <>
          {t('auth.signUpPage.hasAccount')}{' '}
          <Link to={ROUTES.signIn} className={linkClass}>
            {t('auth.signUpPage.signIn')}
          </Link>
        </>
      }
    >
      <GoogleButton />
      <AuthDivider />
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        {formError && <Alert tone="error">{formError}</Alert>}
        <Input
          label={t('auth.fields.name')}
          autoComplete="name"
          error={fieldError(errors.name?.message)}
          {...register('name')}
        />
        <Input
          label={t('auth.fields.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          error={fieldError(errors.email?.message)}
          {...register('email')}
        />
        <div className="grid gap-3">
          <Input
            label={t('auth.fields.password')}
            type="password"
            autoComplete="new-password"
            error={fieldError(errors.password?.message)}
            aria-describedby="password-rules"
            {...register('password')}
          />
          <PasswordRules id="password-rules" value={password} />
        </div>
        <Input
          label={t('auth.fields.passwordConfirmation')}
          type="password"
          autoComplete="new-password"
          error={fieldError(errors.password_confirmation?.message)}
          {...register('password_confirmation')}
        />
        <Input
          label={t('auth.fields.birthDate')}
          type="date"
          autoComplete="bday"
          hint={t('auth.signUpPage.birthDateHint')}
          error={fieldError(errors.birth_date?.message)}
          {...register('birth_date')}
        />
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
          error={fieldError(errors.accept_terms?.message)}
          {...register('accept_terms')}
        />
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {t('auth.signUpPage.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
