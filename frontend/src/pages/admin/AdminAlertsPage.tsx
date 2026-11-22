import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, DatabaseBackup, Mail, Rocket } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Tabs } from '../../components/ui/Tabs'
import { useToast } from '../../components/ui/toastContext'
import { adminApi, type AlertType } from '../../features/admin/adminApi'
import { errorMessage } from '../../features/auth/errors'
import { AdminPage, Loading } from './AdminParts'

const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const ICONS: Record<AlertType, typeof AlertTriangle> = {
  app_error: AlertTriangle,
  backup_failed: DatabaseBackup,
  mail_failed: Mail,
  deploy_failed: Rocket,
}

export function AdminAlertsPage() {
  const { t } = useTranslation()
  return (
    <AdminPage title={t('admin.nav.alerts')} intro={t('admin.alerts.intro')}>
      <Tabs
        items={[
          { value: 'open', label: t('admin.alerts.open'), content: <AlertList status="open" /> },
          { value: 'resolved', label: t('admin.alerts.resolved'), content: <AlertList status="resolved" /> },
        ]}
      />
    </AdminPage>
  )
}

function AlertList({ status }: { status: 'open' | 'resolved' }) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [resolving, setResolving] = useState<number | null>(null)
  const query = useQuery({ queryKey: ['admin', 'alerts', status], queryFn: () => adminApi.alerts(status) })

  const resolve = async (id: number) => {
    setResolving(id)
    try {
      await adminApi.resolveAlert(id)
      toast({ title: t('admin.alerts.resolvedToast') })
      await queryClient.invalidateQueries({ queryKey: ['admin'] })
    } catch (e) {
      toast({ title: errorMessage(e, t), tone: 'error' })
    } finally {
      setResolving(null)
    }
  }

  if (query.isPending) return <Loading />
  if (query.isError) return <Alert tone="error">{errorMessage(query.error, t)}</Alert>
  if (query.data.length === 0) {
    return (
      <p className="text-muted flex items-center gap-2">
        {status === 'open' && <CheckCircle2 className="text-success size-5" aria-hidden />}
        {t(status === 'open' ? 'admin.alerts.emptyOpen' : 'admin.alerts.emptyResolved')}
      </p>
    )
  }

  return (
    <ul className="grid gap-2" aria-label={t(`admin.alerts.${status}`)}>
      {query.data.map((a) => {
        const Icon = ICONS[a.type] ?? AlertTriangle
        return (
          <li key={a.id}>
            <Card className="grid gap-3">
              <div className="flex items-start gap-3">
                <Icon
                  className={
                    status === 'open'
                      ? 'text-warning mt-0.5 size-5 shrink-0'
                      : 'text-muted mt-0.5 size-5 shrink-0'
                  }
                  aria-hidden
                />
                <div className="grid min-w-0 gap-1">
                  <span className="font-semibold">{t(`admin.alerts.types.${a.type}`)}</span>
                  <code className="text-muted text-sm break-words whitespace-pre-wrap">{a.message}</code>
                  <span className="text-muted text-xs">
                    {t('admin.alerts.occurrences', { count: a.occurrences })} ·{' '}
                    {t('admin.alerts.last', { date: dateTime.format(new Date(a.last_occurred_at)) })}
                    {a.resolved_at &&
                      ` · ${t('admin.alerts.resolvedAt', { date: dateTime.format(new Date(a.resolved_at)) })}`}
                  </span>
                </div>
              </div>
              {status === 'open' && (
                <Button
                  variant="secondary"
                  className="w-fit"
                  loading={resolving === a.id}
                  onClick={() => resolve(a.id)}
                >
                  <CheckCircle2 className="size-4" aria-hidden />
                  {t('admin.alerts.resolve')}
                </Button>
              )}
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
