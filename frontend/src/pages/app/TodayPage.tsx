import { ClipboardList } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../../components/ui/Card'
import { useMe } from '../../features/auth/useAuth'

function greetingKey(hour: number) {
  if (hour < 12) return 'appPages.today.greetingMorning'
  if (hour < 18) return 'appPages.today.greetingAfternoon'
  return 'appPages.today.greetingEvening'
}

// Placeholder "Hoje" screen until the questionnaire (phase 6) and the full dashboard (phase 11).
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
      <Card className="grid gap-3">
        <ClipboardList className="text-primary size-8" aria-hidden />
        <h2 className="text-2xl font-extrabold uppercase italic">{t('appPages.today.soonTitle')}</h2>
        <p className="text-muted">{t('appPages.today.soonText')}</p>
      </Card>
    </div>
  )
}
