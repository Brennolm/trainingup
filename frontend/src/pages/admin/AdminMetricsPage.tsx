import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { adminApi, type Metrics } from '../../features/admin/adminApi'
import { errorMessage } from '../../features/auth/errors'
import { ROUTES } from '../../routes'
import { AdminPage, Loading } from './AdminParts'

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

/** Stat tile: label, value (neutral ink), "Em breve" when the metric doesn't exist yet. */
function Tile({ label, value, hint }: { label: string; value: number | null; hint?: string }) {
  const { t } = useTranslation()
  return (
    <div className="bg-surface ring-border grid content-start gap-1 rounded-2xl p-4 ring-1 ring-inset">
      <dt className="text-muted text-sm">{label}</dt>
      <dd className="grid gap-0.5">
        {value === null ? (
          <span className="text-muted font-display text-2xl font-semibold">{t('admin.metrics.soon')}</span>
        ) : (
          <span className="font-display text-4xl font-semibold tabular-nums">{compact.format(value)}</span>
        )}
        {hint && <span className="text-muted text-xs">{hint}</span>}
      </dd>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-muted text-sm font-semibold tracking-wider uppercase">{title}</h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</dl>
    </section>
  )
}

function AlertsStatus({ open }: { open: number }) {
  const { t } = useTranslation()
  if (open === 0) {
    return (
      <p className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="text-success size-5" aria-hidden />
        {t('admin.metrics.noAlerts')}
      </p>
    )
  }
  return (
    <Link
      to={ROUTES.adminAlerts}
      className="bg-warning/10 ring-warning/30 flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-inset"
    >
      <AlertTriangle className="text-warning size-5 shrink-0" aria-hidden />
      {t('admin.metrics.openAlerts', { count: open })}
    </Link>
  )
}

export function AdminMetricsPage() {
  const { t } = useTranslation()
  const query = useQuery({ queryKey: ['admin', 'metrics'], queryFn: adminApi.metrics })

  return (
    <AdminPage title={t('admin.nav.metrics')}>
      {query.isPending && <Loading />}
      {query.isError && <Alert tone="error">{errorMessage(query.error, t)}</Alert>}
      {query.data && <MetricsView m={query.data} />}
    </AdminPage>
  )
}

function MetricsView({ m }: { m: Metrics }) {
  const { t } = useTranslation()
  return (
    <>
      <AlertsStatus open={m.open_alerts} />
      <Group title={t('admin.metrics.users')}>
        <Tile label={t('admin.metrics.usersTotal')} value={m.users_total} />
        <Tile
          label={t('admin.metrics.usersVerified')}
          value={m.users_verified}
          hint={t('admin.metrics.ofTotal', { total: m.users_total })}
        />
        <Tile label={t('admin.metrics.active7d')} value={m.active_7d} />
        <Tile label={t('admin.metrics.signups7d')} value={m.signups_7d} />
        <Tile label={t('admin.metrics.signups30d')} value={m.signups_30d} />
      </Group>
      <Group title={t('admin.metrics.questionnaire')}>
        <Tile label={t('admin.metrics.questionnairesCompleted')} value={m.questionnaires_completed} />
        <Tile label={t('admin.metrics.screeningsBlocked')} value={m.screenings_blocked} />
      </Group>
      <Group title={t('admin.metrics.usage')}>
        <Tile label={t('admin.metrics.plansGenerated')} value={m.plans_generated} />
        <Tile label={t('admin.metrics.sessionsLogged')} value={m.sessions_logged} />
      </Group>
    </>
  )
}
