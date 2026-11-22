import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { z } from 'zod'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { Card, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/toastContext'
import { authApi, googleRedirectUrl } from '../../features/auth/authApi'
import { PasswordRules } from '../../features/auth/components/PasswordRules'
import { applyFieldErrors, errorMessage } from '../../features/auth/errors'
import { PASSWORD_RULES } from '../../features/auth/schemas'
import type { User } from '../../features/auth/types'
import { useSetMe } from '../../features/auth/useAuth'
import { TwoFactorSection } from './TwoFactorSection'

const GOOGLE_RESULT: Record<string, { tone: 'success' | 'error'; key: string }> = {
  vinculado: { tone: 'success', key: 'profile.security.linkedOk' },
  em_uso: { tone: 'error', key: 'profile.security.inUse' },
  erro: { tone: 'error', key: 'profile.security.linkError' },
}

function passwordSchema(hasPassword: boolean) {
  return z
    .object({
      current_password: hasPassword ? z.string().min(1, 'validation.passwordRequired') : z.string(),
      password: z
        .string()
        .min(1, 'validation.passwordRequired')
        .refine((v) => PASSWORD_RULES.every((r) => r.test(v)), 'validation.passwordWeak'),
      password_confirmation: z.string().min(1, 'validation.confirmRequired'),
    })
    .refine((v) => v.password === v.password_confirmation, {
      path: ['password_confirmation'],
      message: 'validation.passwordMismatch',
    })
}
type PasswordValues = z.infer<ReturnType<typeof passwordSchema>>

/** Profile → Segurança: Google link/unlink, 2FA and create/change password. */
export function SecuritySection({ user }: { user: User }) {
  const { t } = useTranslation()
  const toast = useToast()
  const setMe = useSetMe()
  const [params, setParams] = useSearchParams()
  const googleResult = GOOGLE_RESULT[params.get('google') ?? '']
  const [unlinking, setUnlinking] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema(user.has_password)),
    defaultValues: { current_password: '', password: '', password_confirmation: '' },
  })
  const password = useWatch({ control, name: 'password' })

  const unlink = async () => {
    setUnlinking(true)
    setGoogleError(null)
    try {
      setMe(await authApi.googleUnlink())
      toast({ title: t('profile.security.unlinked') })
    } catch (error) {
      setGoogleError(errorMessage(error, t))
    } finally {
      setUnlinking(false)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      setMe(
        await authApi.changePassword({
          current_password: user.has_password ? values.current_password : undefined,
          password: values.password,
          password_confirmation: values.password_confirmation,
        }),
      )
      reset()
      toast({ title: t('profile.security.passwordSaved') })
    } catch (error) {
      if (!applyFieldErrors(error, setError, ['current_password', 'password']))
        setFormError(errorMessage(error, t))
    }
  })

  return (
    <Card className="grid gap-6">
      <CardTitle>{t('profile.security.title')}</CardTitle>

      <section className="grid gap-3" aria-labelledby="security-google">
        <h3 id="security-google" className="font-semibold">
          {t('profile.security.google')}
        </h3>
        {googleResult && (
          <Alert tone={googleResult.tone}>
            {t(googleResult.key)}{' '}
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => setParams({}, { replace: true })}
            >
              {t('common.close')}
            </button>
          </Alert>
        )}
        {googleError && <Alert tone="error">{googleError}</Alert>}
        <p className="text-muted text-sm">
          {user.google_linked ? t('profile.security.googleLinked') : t('profile.security.googleNotLinked')}
        </p>
        {user.google_linked ? (
          <>
            {!user.has_password && (
              <p className="text-muted text-sm">{t('profile.security.needsPassword')}</p>
            )}
            <Button
              variant="secondary"
              onClick={unlink}
              loading={unlinking}
              disabled={!user.has_password}
              className="w-fit"
            >
              {t('profile.security.unlink')}
            </Button>
          </>
        ) : (
          <a
            href={googleRedirectUrl('link')}
            className={buttonClasses({ variant: 'secondary', className: 'w-fit' })}
          >
            {t('profile.security.link')}
          </a>
        )}
      </section>

      <TwoFactorSection user={user} />

      <section className="grid gap-4" aria-labelledby="security-password">
        <h3 id="security-password" className="font-semibold">
          {user.has_password ? t('profile.security.changePassword') : t('profile.security.createPassword')}
        </h3>
        {!user.has_password && <p className="text-muted text-sm">{t('profile.security.createHint')}</p>}
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          {formError && <Alert tone="error">{formError}</Alert>}
          {user.has_password && (
            <Input
              label={t('profile.security.currentPassword')}
              type="password"
              autoComplete="current-password"
              error={errors.current_password?.message && t(errors.current_password.message)}
              {...register('current_password')}
            />
          )}
          <div className="grid gap-3">
            <Input
              label={t('profile.security.newPassword')}
              type="password"
              autoComplete="new-password"
              aria-describedby="security-password-rules"
              error={errors.password?.message && t(errors.password.message)}
              {...register('password')}
            />
            <PasswordRules id="security-password-rules" value={password} />
          </div>
          <Input
            label={t('auth.fields.passwordConfirmation')}
            type="password"
            autoComplete="new-password"
            error={errors.password_confirmation?.message && t(errors.password_confirmation.message)}
            {...register('password_confirmation')}
          />
          <Button type="submit" loading={isSubmitting} className="w-fit">
            {t('profile.security.savePassword')}
          </Button>
        </form>
      </section>
    </Card>
  )
}
