import { ArrowLeft } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { ApiError } from '../../lib/api'
import { errorMessage } from '../auth/errors'
import type { Section } from './options'
import { questionnaireApi, useSetQuestionnaire } from './questionnaireApi'
import type { Questionnaire } from './types'

export type StepProps = {
  questionnaire: Questionnaire
  onSaved: (questionnaire: Questionnaire) => void
  submitLabel: string
  onBack?: () => void
}

type Props = StepProps & {
  section: Section
  /** Body to send, or null when an answer is missing (the step then shows its field errors). */
  build: () => Record<string, unknown> | null
  /** Saved health answers are changing: ask for the explicit confirmation up front (SPEC 5.1). */
  confirmRequired?: boolean
  children: ReactNode
}

/** One questionnaire section: saves it, shows errors and the rectification confirmation. */
export function StepForm({
  section,
  build,
  onSaved,
  submitLabel,
  onBack,
  confirmRequired = false,
  children,
}: Props) {
  const { t } = useTranslation()
  const setQuestionnaire = useSetQuestionnaire()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serverAsksConfirm, setServerAsksConfirm] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const askConfirm = confirmRequired || serverAsksConfirm

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const body = build()
    if (!body) {
      setError(t('questionnaire.missing'))
      return
    }
    if (askConfirm && !confirmed) {
      setError(t('questionnaire.confirmCorrectRequired'))
      return
    }
    setSaving(true)
    try {
      const saved = await questionnaireApi.saveSection(section, { ...body, confirm_correct: confirmed })
      setQuestionnaire({ data: saved })
      onSaved(saved)
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        if (err.field('confirm_correct')) setServerAsksConfirm(true)
        setError(Object.values(err.errors)[0]?.[0] ?? errorMessage(err, t))
      } else {
        setError(errorMessage(err, t))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6">
      {children}

      {askConfirm && (
        <div className="bg-warning/10 ring-warning/30 rounded-xl p-3 ring-1 ring-inset">
          <p className="text-sm">{t('questionnaire.rectifyNotice')}</p>
          <Checkbox
            label={t('questionnaire.confirmCorrect')}
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {onBack ? (
          <Button variant="ghost" size="lg" onClick={onBack}>
            <ArrowLeft className="size-5" aria-hidden />
            {t('questionnaire.back')}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="lg" loading={saving} className="sm:min-w-48">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
