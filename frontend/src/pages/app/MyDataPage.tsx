import { ArrowLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Card, CardTitle } from '../../components/ui/Card'
import { useToast } from '../../components/ui/toastContext'
import { errorMessage } from '../../features/auth/errors'
import { useMe } from '../../features/auth/useAuth'
import { BlockedNotice } from '../../features/questionnaire/BlockedNotice'
import { HealthConsentBox } from '../../features/questionnaire/HealthConsent'
import { SECTION_SLUGS, SECTIONS, sectionFromSlug } from '../../features/questionnaire/options'
import {
  questionnaireApi,
  useQuestionnaire,
  useSetQuestionnaire,
} from '../../features/questionnaire/questionnaireApi'
import { describeSection, STEP_COMPONENTS } from '../../features/questionnaire/sections'
import { ROUTES } from '../../routes'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function Page({
  back,
  title,
  children,
}: {
  back: { to: string; label: string }
  title: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <Link
        to={back.to}
        className="text-muted hover:text-text flex h-11 w-fit items-center gap-2 font-semibold"
      >
        <ArrowLeft className="size-5" aria-hidden />
        {back.label}
      </Link>
      <h1 className="text-4xl font-extrabold uppercase italic">{title}</h1>
      {children}
    </div>
  )
}

function Loading() {
  const { t } = useTranslation()
  return (
    <div role="status" className="grid place-items-center py-16">
      <Loader2 className="text-primary size-8 animate-spin" aria-hidden />
      <span className="sr-only">{t('appPages.loading')}</span>
    </div>
  )
}

/** Health data consent missing (e.g. new text version): ask again before any edit. */
function ConsentAgain() {
  const { t } = useTranslation()
  const setQuestionnaire = useSetQuestionnaire()
  const [accepted, setAccepted] = useState(false)
  const [showError, setShowError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accept = async () => {
    if (!accepted) return setShowError(true)
    setLoading(true)
    try {
      await questionnaireApi.consent()
      setQuestionnaire({ health_consent: true })
    } catch (e) {
      setError(errorMessage(e, t))
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-4">
      <HealthConsentBox
        accepted={accepted}
        onChange={setAccepted}
        error={showError && !accepted ? t('questionnaire.consent.required') : undefined}
      />
      {error && <Alert tone="error">{error}</Alert>}
      <Button size="lg" onClick={accept} loading={loading} className="w-full sm:w-fit">
        {t('questionnaire.consent.continue')}
      </Button>
    </div>
  )
}

/** Perfil → Meus dados: answers of the current questionnaire, one section at a time (SPEC 6.8). */
export function MyDataPage() {
  const { t } = useTranslation()
  const { data: user } = useMe()
  const query = useQuestionnaire()

  useEffect(() => {
    document.title = `${t('myData.title')} · ${t('app.name')}`
  }, [t])

  const back = { to: ROUTES.profile, label: t('privacy.consentsPage.back') }
  if (query.isPending || !user) return <Loading />
  if (query.isError) return <Alert tone="error">{errorMessage(query.error, t)}</Alert>

  const { data: questionnaire, health_consent: consent } = query.data
  const completed = questionnaire?.completed_at ? questionnaire : null

  return (
    <Page back={back} title={t('myData.title')}>
      {!completed ? (
        <Card className="grid gap-3">
          <p className="text-muted">{t(questionnaire ? 'myData.draft' : 'myData.empty')}</p>
          <ButtonLink to={ROUTES.questionnaire} size="lg" className="w-full sm:w-fit">
            {t(questionnaire ? 'questionnaire.intro.continue' : 'questionnaire.intro.start')}
          </ButtonLink>
        </Card>
      ) : !consent ? (
        <ConsentAgain />
      ) : (
        <>
          <p className="text-muted">{t('myData.subtitle')}</p>
          {completed.blocked && <BlockedNotice showRectify={false} />}
          <ul className="grid gap-3">
            {SECTIONS.map((section) => (
              <li key={section}>
                <Link
                  to={`${ROUTES.myData}/${SECTION_SLUGS[section]}`}
                  className="bg-surface ring-border hover:ring-muted grid gap-3 rounded-2xl p-4 ring-1 transition-shadow ring-inset sm:p-5"
                  aria-label={t('myData.editSection', { section: t(`questionnaire.steps.${section}`) })}
                >
                  <span className="flex items-center justify-between gap-3">
                    <CardTitle>{t(`questionnaire.steps.${section}`)}</CardTitle>
                    <ChevronRight className="text-muted size-5 shrink-0" aria-hidden />
                  </span>
                  <dl className="grid gap-1.5 text-sm">
                    {describeSection(section, completed, t, user.preferences).map((item) => (
                      <div key={item.label} className="flex flex-wrap justify-between gap-x-3">
                        <dt className="text-muted">{item.label}</dt>
                        <dd className="text-right font-semibold">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {section === 'health' && completed.health?.rectified_at && (
                    <span className="text-muted text-xs">
                      {t('myData.rectifiedAt', {
                        date: dateFormat.format(new Date(completed.health.rectified_at)),
                      })}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <Card className="grid gap-3">
            <CardTitle>{t('myData.redoTitle')}</CardTitle>
            <p className="text-muted text-sm">{t('myData.redoText')}</p>
            <ButtonLink to={ROUTES.questionnaire} variant="secondary" className="w-fit">
              <RotateCcw className="size-4" aria-hidden />
              {t('myData.redo')}
            </ButtonLink>
          </Card>
        </>
      )}
    </Page>
  )
}

/** Perfil → Meus dados → one section: same form as the wizard step, saved on its own. */
export function MyDataSectionPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const navigate = useNavigate()
  const { section: slug } = useParams()
  const section = sectionFromSlug(slug)
  const query = useQuestionnaire()

  useEffect(() => {
    if (section) document.title = `${t(`questionnaire.steps.${section}`)} · ${t('app.name')}`
  }, [t, section])

  if (!section) return <Navigate to={ROUTES.myData} replace />
  if (query.isPending) return <Loading />
  if (query.isError) return <Alert tone="error">{errorMessage(query.error, t)}</Alert>

  const { data: questionnaire, health_consent: consent } = query.data
  if (!questionnaire?.completed_at || !consent) return <Navigate to={ROUTES.myData} replace />

  const Step = STEP_COMPONENTS[section]
  return (
    <Page back={{ to: ROUTES.myData, label: t('myData.back') }} title={t(`questionnaire.steps.${section}`)}>
      <Step
        questionnaire={questionnaire}
        submitLabel={t('common.save')}
        onSaved={() => {
          toast({ title: t('myData.saved') })
          void navigate(ROUTES.myData)
        }}
      />
    </Page>
  )
}
