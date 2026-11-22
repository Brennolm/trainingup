import { CheckCircle2, ClipboardList } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Card } from '../../components/ui/Card'
import { useMe } from '../../features/auth/useAuth'
import { BlockedNotice } from '../../features/questionnaire/BlockedNotice'
import { SECTIONS } from '../../features/questionnaire/options'
import { useQuestionnaire } from '../../features/questionnaire/questionnaireApi'
import { ROUTES } from '../../routes'

function greetingKey(hour: number) {
  if (hour < 12) return 'appPages.today.greetingMorning'
  if (hour < 18) return 'appPages.today.greetingAfternoon'
  return 'appPages.today.greetingEvening'
}

/** Questionnaire status on "Hoje": invite, resume, blocked or waiting for the plans (phases 8/10). */
function QuestionnaireCard() {
  const { t } = useTranslation()
  const { data } = useQuestionnaire()
  if (!data) return null

  const q = data.data
  if (q?.completed_at) {
    if (q.blocked) return <BlockedNotice />
    return (
      <Card className="grid gap-3">
        <CheckCircle2 className="text-success size-8" aria-hidden />
        <h2 className="text-2xl font-extrabold uppercase italic">{t('appPages.today.plansSoonTitle')}</h2>
        <p className="text-muted">{t('appPages.today.plansSoonText')}</p>
      </Card>
    )
  }

  const filled = q?.filled_sections.length ?? 0
  return (
    <Card className="grid gap-3">
      <ClipboardList className="text-primary size-8" aria-hidden />
      <h2 className="text-2xl font-extrabold uppercase italic">
        {t(q ? 'appPages.today.resumeTitle' : 'appPages.today.startTitle')}
      </h2>
      <p className="text-muted">
        {q
          ? t('appPages.today.resumeText', { filled, total: SECTIONS.length })
          : t('appPages.today.startText')}
      </p>
      <ButtonLink to={ROUTES.questionnaire} size="lg" className="w-full sm:w-fit">
        {t(q ? 'questionnaire.intro.continue' : 'questionnaire.intro.start')}
      </ButtonLink>
    </Card>
  )
}

// "Hoje" until the full dashboard (phase 11).
export function TodayPage() {
  const { t, i18n } = useTranslation()
  const { data: user } = useMe()
  const [now] = useState(() => new Date())
  const firstName = user?.name.split(' ')[0] ?? ''

  useEffect(() => {
    document.title = `${t('nav.today')} · ${t('app.name')}`
  }, [t])

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <header className="grid gap-1">
        <h1 className="text-4xl leading-tight font-extrabold uppercase italic">
          {t(greetingKey(now.getHours()), { name: firstName })}
        </h1>
        <p className="text-muted first-letter:uppercase">
          {new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }).format(
            now,
          )}
        </p>
      </header>
      <QuestionnaireCard />
    </div>
  )
}
