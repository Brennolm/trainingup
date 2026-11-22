import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { useToast } from '../../components/ui/toastContext'
import { authApi } from '../../features/auth/authApi'
import { applyFieldErrors, errorMessage } from '../../features/auth/errors'
import { profileSchema, type ProfileValues } from '../../features/auth/schemas'
import type { LengthUnit, Preferences, WeightUnit } from '../../features/auth/types'
import { ME_QUERY_KEY, useMe, useSetMe } from '../../features/auth/useAuth'
import { ROUTES } from '../../routes'
import { useTheme, type Theme } from '../../theme/themeContext'
import { PrivacySection } from './PrivacySection'
import { SecuritySection } from './SecuritySection'

export function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const setMe = useSetMe()
  const { data: user } = useMe()
  const { theme, setTheme } = useTheme()
  const [formError, setFormError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', birth_date: user?.birth_date ?? '' },
  })

  useEffect(() => {
    document.title = `${t('profile.title')} · ${t('app.name')}`
  }, [t])

  if (!user) return null

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const updated = await authApi.updateProfile(values)
      setMe(updated)
      reset({ name: updated.name, birth_date: updated.birth_date ?? '' })
      toast({ title: t('profile.personal.saved') })
    } catch (error) {
      if (!applyFieldErrors(error, setError, ['name', 'birth_date'])) setFormError(errorMessage(error, t))
    }
  })

  const savePreference = async (prefs: Preferences) => {
    const previous = user
    setMe({ ...user, preferences: { ...user.preferences, ...prefs } }) // optimistic
    try {
      setMe(await authApi.updatePreferences(prefs))
      toast({ title: t('profile.preferences.saved') })
    } catch (error) {
      setMe(previous)
      toast({ title: errorMessage(error, t), tone: 'error' })
    }
  }

  const signOut = async () => {
    setSigningOut(true)
    await authApi.logout().catch(() => undefined)
    // Remove (not null) the cached user: screens still mounted during the transition keep their
    // data, so the auth guard does not redirect to sign-in; the next protected page asks the API.
    await navigate(ROUTES.home, { replace: true })
    queryClient.removeQueries({ queryKey: ME_QUERY_KEY })
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <h1 className="text-4xl font-extrabold uppercase italic">{t('profile.title')}</h1>

      <Card className="grid gap-5">
        <CardTitle>{t('profile.personal.title')}</CardTitle>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          {formError && <Alert tone="error">{formError}</Alert>}
          <Input
            label={t('auth.fields.name')}
            autoComplete="name"
            error={errors.name?.message && t(errors.name.message)}
            {...register('name')}
          />
          <Input
            label={t('auth.fields.email')}
            type="email"
            value={user.email}
            readOnly
            hint={t('profile.personal.emailHint')}
            className="[&_input]:text-muted"
          />
          <Input
            label={t('auth.fields.birthDate')}
            type="date"
            error={errors.birth_date?.message && t(errors.birth_date.message)}
            {...register('birth_date')}
          />
          <Button type="submit" loading={isSubmitting} disabled={!isDirty} className="w-fit">
            {t('profile.personal.save')}
          </Button>
        </form>
      </Card>

      <Card className="grid gap-5">
        <CardTitle>{t('profile.preferences.title')}</CardTitle>
        <SegmentedControl<Theme>
          label={t('profile.preferences.theme')}
          value={theme}
          onChange={setTheme} // saved to the account by AccountThemeSync
          options={[
            { value: 'dark', label: t('theme.dark') },
            { value: 'light', label: t('theme.light') },
          ]}
        />
        <SegmentedControl<WeightUnit>
          label={t('profile.preferences.weight')}
          value={user.preferences.weight_unit}
          onChange={(weight_unit) => savePreference({ weight_unit })}
          options={[
            { value: 'kg', label: t('profile.preferences.kg') },
            { value: 'lb', label: t('profile.preferences.lb') },
          ]}
        />
        <SegmentedControl<LengthUnit>
          label={t('profile.preferences.length')}
          value={user.preferences.length_unit}
          onChange={(length_unit) => savePreference({ length_unit })}
          options={[
            { value: 'cm', label: t('profile.preferences.cm') },
            { value: 'ft_in', label: t('profile.preferences.ftIn') },
          ]}
        />
      </Card>

      <SecuritySection user={user} />

      <PrivacySection user={user} />

      <Button variant="danger" size="lg" onClick={signOut} loading={signingOut} className="w-full sm:w-fit">
        <LogOut className="size-5" aria-hidden />
        {t('profile.signOut')}
      </Button>
    </div>
  )
}
