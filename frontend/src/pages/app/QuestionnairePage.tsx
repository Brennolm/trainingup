import { CheckCircle2, ClipboardList, Loader2, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Card, CardTitle } from '../../components/ui/Card'
import { Checkbox } from '../../components/ui/Checkbox'
import { errorMessage } from '../../features/auth/errors'
import type { User } from '../../features/auth/types'
import { useMe } from '../../features/auth/useAuth'
import { BlockedNotice } from '../../features/questionnaire/BlockedNotice'
import { HealthConsentBox } from '../../features/questionnaire/HealthConsent'
import { SECTIONS } from '../../features/questionnaire/options'
import {
  questionnaireApi,
  useQuestionnaire,
  useSetQuestionnaire,
} from '../../features/questionnaire/questionnaireApi'
import { describeSection, firstMissingStep, STEP_COMPONENTS } from '../../features/questionnaire/sections'
import type { Questionnaire } from '../../features/questionnaire/types'
import { ROUTES } from '../../routes'

const TOTAL_STEPS = SECTIONS.length + 1 // + Resumo

export function QuestionnairePage() {
  const { t } = useTranslation()
  const query = useQuestionnaire()
  const { data: user } = useMe()
  const [step, setStep] = useState<number | null>(null)
  const [finished, setFinished] = useState<Questionnaire | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = `${t('questionnaire.title')} · ${t('app.name')}`
  }, [t])

  // New step: back to the top, focus on its title (screen readers announce it).
  const goTo = (index: number) => {
    setStep(index)
    requestAnimationFrame(() => {
      headingRef.current?.scrollIntoView?.({ block: 'start' })
      headingRef.current?.focus({ preventScroll: true })
    })
  }

  if (query.isPending || !user) {
    return (
      <div role="status" className="grid place-items-center py-16">
        <Loader2 className="text-primary size-8 animate-spin" aria-hidden />
        <span className="sr-only">{t('appPages.loading')}</span>
      </div>
    )
  }
  if (query.isError) return <Alert tone="error">{errorMessage(query.error, t)}</Alert>

  if (finished) return <Finished questionnaire={finished} />

  const { data: questionnaire, health_consent: consent } = query.data
  const draft = questionnaire && !questionnaire.completed_at ? questionnaire : null

  if (!draft || !consent) {
    return (
      <Intro
        questionnaire={questionnaire}
        needsConsent={!consent}
        onStarted={(q) => goTo(firstMissingStep(q))}
      />
    )
  }

  const current = step ?? firstMissingStep(draft)
  const section = SECTIONS[current]
  const Step = section ? STEP_COMPONENTS[section] : null
  const titleKey = section ? `questionnaire.steps.${section}` : 'questionnaire.steps.summary'

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <header className="grid gap-3">
        <p className="text-muted text-sm font-semibold">
          {t('questionnaire.progress', { step: current + 1, total: TOTAL_STEPS })}
        </p>
        <div
          role="progressbar"
          aria-label={t('questionnaire.progressLabel')}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={current + 1}
          className="bg-surface-2 h-2 overflow-hidden rounded-full"
        >
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-300"
            style={{ width: `${((current + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="scroll-mt-6 text-3xl font-extrabold uppercase italic outline-none sm:text-4xl"
        >
          {t(titleKey)}
        </h1>
        {section && <p className="text-muted">{t(`questionnaire.stepIntro.${section}`)}</p>}
      </header>

      {Step ? (
        <Step
          key={section}
          questionnaire={draft}
          submitLabel={t('common.continue')}
          onBack={current > 0 ? () => goTo(current - 1) : undefined}
          onSaved={(saved) => goTo(nextStep(saved, current))}
        />
      ) : (
        <Summary
          questionnaire={draft}
          user={user}
          onEdit={goTo}
          onBack={() => goTo(SECTIONS.length - 1)}
          onFinished={setFinished}
        />
      )}
    </div>
  )
}

/** After saving a step, go to the next one (or jump to the summary when everything is filled). */
function nextStep(q: Questionnaire, current: number): number {
  return q.filled_sections.length === SECTIONS.length ? SECTIONS.length : current + 1
}

function Intro({
  questionnaire,
  needsConsent,
  onStarted,
}: {
  questionnaire: Questionnaire | null
  needsConsent: boolean
  onStarted: (q: Questionnaire) => void
}) {
  const { t } = useTranslation()
  const setQuestionnaire = useSetQuestionnaire()
  const [accepted, setAccepted] = useState(false)
  const [showConsentError, setShowConsentError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const completed = questionnaire?.completed_at != null
  const draft = questionnaire !== null && !completed

  const start = async () => {
    if (needsConsent && !accepted) {
      setShowConsentError(true)
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (needsConsent) {
        await questionnaireApi.consent()
        setQuestionnaire({ health_consent: true })
      }
      const started = await questionnaireApi.start()
      setQuestionnaire({ data: started, health_consent: true })
      onStarted(started)
    } catch (e) {
      setError(errorMessage(e, t))
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <header className="grid gap-3">
        <ClipboardList className="text-primary size-10" aria-hidden />
        <h1 className="text-4xl font-extrabold uppercase italic">
          {t(completed ? 'questionnaire.intro.redoTitle' : 'questionnaire.title')}
        </h1>
        <p className="text-muted">
          {t(completed ? 'questionnaire.intro.redoText' : 'questionnaire.intro.text')}
        </p>
        {completed && (
          <p className="text-muted text-sm">
            {t('questionnaire.intro.redoHint')}{' '}
            <Link to={ROUTES.myData} className="text-primary font-semibold underline">
              {t('myData.title')}
            </Link>
          </p>
        )}
      </header>

      <p className="text-muted text-sm">{t('legal.disclaimer')}</p>

      {needsConsent && (
        <HealthConsentBox
          accepted={accepted}
          onChange={(v) => {
            setAccepted(v)
            if (v) setShowConsentError(false)
          }}
          error={showConsentError ? t('questionnaire.consent.required') : undefined}
        />
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <Button size="lg" onClick={start} loading={loading} className="w-full sm:w-fit sm:min-w-56">
        {t(
          completed
            ? 'questionnaire.intro.redo'
            : draft
              ? 'questionnaire.intro.continue'
              : 'questionnaire.intro.start',
        )}
      </Button>
    </div>
  )
}

function Summary({
  questionnaire,
  user,
  onEdit,
  onBack,
  onFinished,
}: {
  questionnaire: Questionnaire
  user: User
  onEdit: (step: number) => void
  onBack: () => void
  onFinished: (q: Questionnaire) => void
}) {
  const { t } = useTranslation()
  const setQuestionnaire = useSetQuestionnaire()
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const blocked = questionnaire.blocked

  const finish = async () => {
    if (!blocked && !accepted) {
      setError(t('questionnaire.summary.disclaimerRequired'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const done = await questionnaireApi.complete(!blocked && accepted)
      setQuestionnaire({ data: done })
      onFinished(done)
    } catch (e) {
      setError(errorMessage(e, t))
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <p className="text-muted">{t('questionnaire.summary.intro')}</p>
      <ul className="grid gap-3">
        {SECTIONS.map((section, index) => (
          <li key={section}>
            <Card className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{t(`questionnaire.steps.${section}`)}</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => onEdit(index)}
                  aria-label={t('questionnaire.summary.editSection', {
                    section: t(`questionnaire.steps.${section}`),
                  })}
                >
                  <Pencil className="size-4" aria-hidden />
                  {t('questionnaire.summary.edit')}
                </Button>
              </div>
              <dl className="grid gap-2 text-sm">
                {describeSection(section, questionnaire, t, user.preferences).map((item) => (
                  <div key={item.label} className="grid gap-0.5 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-3">
                    <dt className="text-muted">{item.label}</dt>
                    <dd className="font-semibold">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </li>
        ))}
      </ul>

      {blocked ? (
        <BlockedNotice showRectify={false} />
      ) : (
        <Checkbox
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          label={t('questionnaire.summary.disclaimer')}
        />
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="ghost" size="lg" onClick={onBack}>
          {t('questionnaire.back')}
        </Button>
        <Button size="lg" onClick={finish} loading={loading} className="sm:min-w-56">
          {t(blocked ? 'questionnaire.summary.finishBlocked' : 'questionnaire.summary.generate')}
        </Button>
      </div>
    </div>
  )
}

/** After step 7. Plan generation arrives in phases 8 (training) and 10 (diet). */
function Finished({ questionnaire }: { questionnaire: Questionnaire }) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      {questionnaire.blocked ? (
        <>
          <h1 className="text-4xl font-extrabold uppercase italic">
            {t('questionnaire.finished.savedTitle')}
          </h1>
          <BlockedNotice />
        </>
      ) : (
        <Card className="grid gap-3">
          <CheckCircle2 className="text-success size-10" aria-hidden />
          <h1 className="text-3xl font-extrabold uppercase italic">{t('questionnaire.finished.title')}</h1>
          <p className="text-muted">{t('questionnaire.finished.text')}</p>
        </Card>
      )}
      <ButtonLink to={ROUTES.today} size="lg" className="w-full sm:w-fit">
        {t('questionnaire.finished.today')}
      </ButtonLink>
    </div>
  )
}
