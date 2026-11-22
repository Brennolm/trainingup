import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../features/auth/authApi'
import { GoogleButton } from '../../features/auth/components/GoogleButton'
import { applyFieldErrors, errorMessage } from '../../features/auth/errors'
import { birthDate } from '../../features/auth/schemas'
import { useSetMe } from '../../features/auth/useAuth'
import { AuthLayout } from '../../layouts/AuthLayout'
import { ApiError } from '../../lib/api'
import { ROUTES } from '../../routes'

const schema = z.object({
  birth_date: birthDate,
  accept_terms: z.boolean().refine((v) => v, 'validation.termsRequired'),
})
type Values = z.infer<typeof schema>

const linkClass = 'text-text font-semibold underline underline-offset-2'

/** After "Continuar com Google" with a new e-mail: birth date + terms (Google doesn't provide them). */
export function CompleteSignUpPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setMe = useSetMe()
  const [formError, setFormError] = useState<string | null>(null)
  const pending = useQuery({ queryKey: ['google-pending'], queryFn: authApi.googlePending, retry: false })

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { birth_date: '', accept_terms: false },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      setMe(await authApi.googleComplete(values))
      navigate(ROUTES.today, { replace: true })
    } catch (error) {
      if (error instanceof ApiError && (error.status === 409 || error.status === 404)) {
        setFormError(error.message || t('auth.complete.expired'))
      } else if (!applyFieldErrors(error, setError, ['birth_date', 'accept_terms'])) {
        setFormError(errorMessage(error, t))
      }
    }
  })

  if (pending.isPending) {
    return (
      <div className="grid min-h-dvh place-items-center" role="status">
        <Loader2 className="text-primary size-8 animate-spin" aria-hidden />
        <span className="sr-only">{t('appPages.loading')}</span>
      </div>
    )
  }

  if (!pending.data) {
    return (
      <AuthLayout title={t('auth.complete.title')}>
        <Alert tone="warning">{t('auth.complete.expired')}</Alert>
        <GoogleButton />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t('auth.complete.title')} subtitle={t('auth.complete.subtitle')}>
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        {formError && (
          <Alert tone="error">
            {formError}{' '}
            <Link to={ROUTES.signIn} className={linkClass}>
              {t('auth.signIn')}
            </Link>
          </Alert>
        )}
        <div className="bg-surface-2 grid gap-0.5 rounded-xl p-4">
          <span className="text-muted text-xs font-semibold tracking-wider uppercase">
            {t('auth.complete.account')}
          </span>
          <span className="font-semibold">{pending.data.name}</span>
          <span className="text-muted break-all">{pending.data.email}</span>
        </div>
        <Input
          label={t('auth.fields.birthDate')}
          type="date"
          autoComplete="bday"
          hint={t('auth.signUpPage.birthDateHint')}
          error={errors.birth_date?.message && t(errors.birth_date.message)}
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
          error={errors.accept_terms?.message && t(errors.accept_terms.message)}
          {...register('accept_terms')}
        />
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {t('auth.complete.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
