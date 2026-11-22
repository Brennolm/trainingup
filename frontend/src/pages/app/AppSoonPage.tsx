import { Hammer } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../../components/ui/Card'

// Treino, Dieta and Progresso until their phases (8, 10, 9).
export function AppSoonPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = `${t(titleKey)} · ${t('app.name')}`
  }, [t, titleKey])

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <h1 className="text-4xl font-extrabold uppercase italic">{t(titleKey)}</h1>
      <Card className="grid gap-3">
        <Hammer className="text-primary size-8" aria-hidden />
        <h2 className="text-2xl font-extrabold uppercase italic">{t('appPages.soon.title')}</h2>
        <p className="text-muted">{t('appPages.soon.text')}</p>
      </Card>
    </div>
  )
}
