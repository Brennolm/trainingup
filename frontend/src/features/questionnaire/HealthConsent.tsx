import { ShieldCheck } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Checkbox } from '../../components/ui/Checkbox'
import { ROUTES } from '../../routes'

/**
 * LGPD art. 11: specific, highlighted consent for health data, shown before the first question.
 * The parent sends it (questionnaireApi.consent) together with whatever starts next.
 */
export function HealthConsentBox({
  accepted,
  onChange,
  error,
}: {
  accepted: boolean
  onChange: (accepted: boolean) => void
  error?: string
}) {
  const { t } = useTranslation()
  return (
    <section
      aria-labelledby="health-consent-title"
      className="bg-primary/5 ring-primary/30 grid gap-3 rounded-2xl p-4 ring-1 ring-inset sm:p-5"
    >
      <h2 id="health-consent-title" className="flex items-center gap-2 text-lg font-bold">
        <ShieldCheck className="text-primary size-6 shrink-0" aria-hidden />
        {t('questionnaire.consent.title')}
      </h2>
      <ul className="text-muted grid list-disc gap-1.5 pl-5 text-sm">
        {(t('questionnaire.consent.points', { returnObjects: true }) as string[]).map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <Checkbox
        checked={accepted}
        onChange={(e) => onChange(e.target.checked)}
        error={error}
        label={
          <Trans
            i18nKey="questionnaire.consent.accept"
            components={{
              privacy: (
                <Link to={ROUTES.privacy} target="_blank" className="text-primary font-semibold underline" />
              ),
            }}
          />
        }
      />
    </section>
  )
}
