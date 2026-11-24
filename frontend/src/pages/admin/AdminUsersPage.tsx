import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Eye, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Pagination } from '../../components/ui/Pagination'
import { Tabs } from '../../components/ui/Tabs'
import { Textarea } from '../../components/ui/Textarea'
import { adminApi, pageLoad, type AdminUser } from '../../features/admin/adminApi'
import { errorMessage } from '../../features/auth/errors'
import { ApiError } from '../../lib/api'
import { ROUTES } from '../../routes'
import { AdminPage, Badge, Loading } from './AdminParts'

const MIN_REASON = 10
const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const fmt = (iso: string | null, f = dateTime) => (iso ? f.format(new Date(iso)) : null)

export function AdminUsersPage() {
  const { t } = useTranslation()
  return (
    <AdminPage title={t('admin.nav.users')} intro={t('admin.users.intro')}>
      <Tabs
        items={[
          { value: 'users', label: t('admin.users.tabUsers'), content: <UserList /> },
          { value: 'logs', label: t('admin.users.tabLogs'), content: <AccessLog /> },
        ]}
      />
    </AdminPage>
  )
}

function UserList() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [typed, setTyped] = useState('')
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<AdminUser | null>(null)
  const query = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => adminApi.users(page, search),
    placeholderData: keepPreviousData,
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(typed.trim())
  }

  return (
    <div className="grid gap-4">
      <form role="search" onSubmit={submit} className="flex items-end gap-2">
        <Input
          label={t('admin.users.search')}
          type="search"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" variant="secondary" className="h-12" aria-label={t('admin.users.searchButton')}>
          <Search className="size-5" aria-hidden />
        </Button>
      </form>

      {query.isPending && <Loading />}
      {query.isError && <Alert tone="error">{errorMessage(query.error, t)}</Alert>}
      {query.data && (
        <>
          <p className="text-muted text-sm">{t('admin.users.total', { count: query.data.meta.total })}</p>
          {query.data.data.length === 0 ? (
            <p className="text-muted">{t('admin.users.empty')}</p>
          ) : (
            <ul className="grid gap-2" aria-label={t('admin.users.tabUsers')}>
              {query.data.data.map((u) => (
                <li key={u.id}>
                  <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="grid min-w-0 gap-0.5">
                      <span className="flex flex-wrap items-center gap-2 font-semibold">
                        {u.name}
                        {u.role === 'admin' && <Badge>{t('admin.users.admin')}</Badge>}
                        {u.status === 'unverified' && <Badge muted>{t('admin.users.unverified')}</Badge>}
                      </span>
                      <span className="text-muted truncate text-sm">{u.email}</span>
                      <span className="text-muted text-xs">
                        {t('admin.users.createdAt', { date: fmt(u.created_at, date) ?? '—' })} ·{' '}
                        {u.last_seen_at
                          ? t('admin.users.lastSeen', { date: fmt(u.last_seen_at) })
                          : t('admin.users.neverSeen')}
                      </span>
                    </div>
                    {u.role !== 'admin' && (
                      <Button variant="secondary" onClick={() => setViewing(u)} className="shrink-0">
                        <Eye className="size-4" aria-hidden />
                        {t('admin.users.viewAs')}
                      </Button>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
          <Pagination page={page} last={query.data.meta.last_page} onChange={setPage} />
        </>
      )}

      <ViewAsModal user={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

/** SPEC 6.5: reason required before entering; read-only access, logged. */
function ViewAsModal({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const tooShort = reason.trim().length < MIN_REASON

  const close = () => {
    if (loading) return
    setReason('')
    setError(null)
    onClose()
  }

  const enter = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (tooShort) {
      setError(t('admin.users.reasonShort', { min: MIN_REASON }))
      return
    }
    setLoading(true)
    setError(null)
    try {
      await adminApi.impersonate(user.id, reason.trim())
      pageLoad.go(ROUTES.today)
    } catch (err) {
      setError((err instanceof ApiError && err.field('reason')) || errorMessage(err, t))
      setLoading(false)
    }
  }

  return (
    <Modal
      open={user !== null}
      onOpenChange={(open) => !open && close()}
      title={t('admin.users.viewAsTitle', { name: user?.name ?? '' })}
      description={t('admin.users.viewAsText')}
    >
      <form onSubmit={enter} noValidate className="grid gap-4">
        <Textarea
          label={t('admin.users.reason')}
          hint={t('admin.users.reasonHint')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
        />
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" size="lg" fullWidth loading={loading}>
          {t('admin.users.enter')}
        </Button>
      </form>
    </Modal>
  )
}

function AccessLog() {
  const { t } = useTranslation()
  const query = useQuery({ queryKey: ['admin', 'logs'], queryFn: adminApi.logs })

  if (query.isPending) return <Loading />
  if (query.isError) return <Alert tone="error">{errorMessage(query.error, t)}</Alert>
  if (query.data.length === 0) return <p className="text-muted">{t('admin.users.logsEmpty')}</p>

  return (
    <ul className="grid gap-2" aria-label={t('admin.users.tabLogs')}>
      {query.data.map((log) => (
        <li key={log.id}>
          <Card className="grid gap-1">
            <span className="font-semibold">
              {log.user ? `${log.user.name} · ${log.user.email}` : t('admin.users.deletedAccount')}
            </span>
            <span className="text-sm">“{log.reason}”</span>
            <span className="text-muted text-xs">
              {t('admin.users.logLine', {
                admin: log.admin ?? '—',
                start: fmt(log.started_at),
                end: fmt(log.ended_at) ?? t('admin.users.logOpen'),
              })}
            </span>
          </Card>
        </li>
      ))}
    </ul>
  )
}
