import { Hammer } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../../components/ui/Card'
import { Tabs } from '../../components/ui/Tabs'
import { ExerciseLibrary } from '../../features/workout/ExerciseLibrary'

/** Treino (SPEC 6.4). "Meu plano" (8.4) and "Histórico" (8.7) arrive in the next steps of phase 8. */
export function WorkoutPage() {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = `${t('nav.workout')} · ${t('app.name')}`
  }, [t])

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <h1 className="text-4xl font-extrabold uppercase italic">{t('nav.workout')}</h1>
      <Tabs
        // The library is the only part ready so far.
        defaultValue="library"
        items={[
          { value: 'plan', label: t('workout.tabs.plan'), content: <Soon /> },
          { value: 'history', label: t('workout.tabs.history'), content: <Soon /> },
          { value: 'library', label: t('workout.tabs.library'), content: <ExerciseLibrary /> },
        ]}
      />
    </div>
  )
}

function Soon() {
  const { t } = useTranslation()
  return (
    <Card className="grid gap-3">
      <Hammer className="text-primary size-8" aria-hidden />
      <h2 className="text-2xl font-extrabold uppercase italic">{t('appPages.soon.title')}</h2>
      <p className="text-muted">{t('workout.soon')}</p>
    </Card>
  )
}
