import { Eye } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/toastContext'
import { ROUTES } from '../../routes'
import { errorMessage } from '../auth/errors'
import { useMe } from '../auth/useAuth'
import { adminApi, pageLoad } from './adminApi'

/** SPEC 6.5: fixed bar "Você está vendo como {nome} — Sair" while an admin views an account. */
export function ImpersonationBar() {
  const { t } = useTranslation()
  const toast = useToast()
  const { data: user } = useMe()
  const [leaving, setLeaving] = useState(false)
  if (!user?.impersonation) return null

  const leave = async () => {
    setLeaving(true)
    try {
      await adminApi.stopImpersonation()
      pageLoad.go(ROUTES.adminUsers)
    } catch (e) {
      toast({ title: errorMessage(e, t), tone: 'error' })
      setLeaving(false)
    }
  }

  return (
    <div
      role="region"
      aria-label={t('admin.impersonation.barLabel')}
      className="bg-surface border-warning sticky top-0 z-40 flex items-center justify-between gap-3 border-b-2 px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))]"
    >
      <p className="flex min-w-0 items-center gap-2 text-sm">
        <Eye className="text-warning size-5 shrink-0" aria-hidden />
        <span className="min-w-0">
          <strong>{t('admin.impersonation.viewingAs', { name: user.name })}</strong>{' '}
          <span className="text-muted">{t('admin.impersonation.readOnly')}</span>
        </span>
      </p>
      <Button variant="secondary" onClick={leave} loading={leaving} className="shrink-0">
        {t('admin.impersonation.leave')}
      </Button>
    </div>
  )
}
