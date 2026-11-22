import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RotateCcw } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/toastContext'
import { adminApi, type Setting } from '../../features/admin/adminApi'
import { errorMessage } from '../../features/auth/errors'
import { parseDecimal } from '../../lib/units'
import { AdminPage, Loading } from './AdminParts'

const GROUPS = ['bmr', 'activity', 'goal', 'limits', 'protein', 'fat', 'split'] as const
const WORK = ['sedentary', 'standing', 'active'] as const
const BUCKETS = ['low', 'mid', 'high'] as const

const show = (n: number) => String(n).replace('.', ',')

export function AdminSettingsPage() {
  const { t } = useTranslation()
  const query = useQuery({ queryKey: ['admin', 'settings'], queryFn: adminApi.settings })

  return (
    <AdminPage title={t('admin.nav.settings')} intro={t('admin.settings.intro')}>
      {query.isPending && <Loading />}
      {query.isError && <Alert tone="error">{errorMessage(query.error, t)}</Alert>}
      {query.data && <SettingsForm settings={query.data} />}
    </AdminPage>
  )
}

function SettingsForm({ settings }: { settings: Setting[] }) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const byKey: Record<string, Setting | undefined> = Object.fromEntries(settings.map((s) => [s.key, s]))
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(settings.map((s) => [s.key, show(s.value)])),
  )
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invalid = (s: Setting) => {
    const v = parseDecimal(values[s.key] ?? '')
    return v === null || v < s.min || v > s.max
  }
  const changed = settings.some((s) => parseDecimal(values[s.key] ?? '') !== s.value)

  const field = (s: Setting, label: string) => (
    <Input
      key={s.key}
      label={label}
      inputMode="decimal"
      value={values[s.key]}
      onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
      suffix={s.unit ? t(`admin.settings.units.${s.unit}`) : undefined}
      hint={t('admin.settings.default', { value: show(s.default) })}
      error={
        showErrors && invalid(s)
          ? t('admin.settings.range', { min: show(s.min), max: show(s.max) })
          : undefined
      }
    />
  )

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (settings.some(invalid)) {
      setShowErrors(true)
      setError(t('admin.settings.fixErrors'))
      return
    }
    setSaving(true)
    try {
      const res = await adminApi.saveSettings(
        settings.map((s) => ({ key: s.key, value: parseDecimal(values[s.key]) as number })),
      )
      queryClient.setQueryData(['admin', 'settings'], res.data)
      setValues(Object.fromEntries(res.data.map((s) => [s.key, show(s.value)])))
      toast({ title: res.message })
    } catch (err) {
      setError(errorMessage(err, t))
    } finally {
      setSaving(false)
    }
  }

  const restoreDefaults = () => setValues(Object.fromEntries(settings.map((s) => [s.key, show(s.default)])))

  return (
    <form onSubmit={save} noValidate className="grid gap-4">
      {GROUPS.map((group) => (
        <Card key={group} className="grid gap-4">
          <div className="grid gap-1">
            <CardTitle>{t(`admin.settings.groups.${group}.title`)}</CardTitle>
            <p className="text-muted text-sm">{t(`admin.settings.groups.${group}.text`)}</p>
          </div>
          {group === 'activity' ? (
            <div className="grid gap-4">
              {WORK.map((work) => (
                <fieldset key={work} className="grid gap-2">
                  <legend className="mb-1 font-semibold">{t(`questionnaire.options.work.${work}`)}</legend>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {BUCKETS.map((b) => {
                      const setting = byKey[`activity.${work}.${b}`]
                      return setting && field(setting, t(`admin.settings.buckets.${b}`))
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {settings
                .filter((s) => s.key.startsWith(`${group}.`))
                .map((s) => field(s, t(`admin.settings.labels.${s.key}`)))}
            </div>
          )}
        </Card>
      ))}

      {error && <Alert tone="error">{error}</Alert>}

      <div className="bg-bg/95 sticky bottom-20 flex flex-col-reverse gap-3 py-2 backdrop-blur sm:flex-row sm:justify-between md:bottom-0">
        <Button variant="ghost" onClick={restoreDefaults}>
          <RotateCcw className="size-4" aria-hidden />
          {t('admin.settings.restore')}
        </Button>
        <Button type="submit" size="lg" loading={saving} disabled={!changed} className="sm:min-w-48">
          {t('admin.settings.save')}
        </Button>
      </div>
    </form>
  )
}
