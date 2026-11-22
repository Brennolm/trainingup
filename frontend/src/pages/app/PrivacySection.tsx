import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Download, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/toastContext'
import { authApi } from '../../features/auth/authApi'
import { errorMessage } from '../../features/auth/errors'
import type { User } from '../../features/auth/types'
import { ApiError } from '../../lib/api'
import { ROUTES } from '../../routes'

const DELETE_WORD = 'EXCLUIR'
const rowClass =
  'hover:bg-surface-2 -mx-3 flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left'

function saveJson(data: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Profile → Privacidade: LGPD rights (export, consents, delete) and the legal documents. */
export function PrivacySection({ user }: { user: User }) {
  const { t } = useTranslation()
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [word, setWord] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const exportData = async () => {
    setExporting(true)
    try {
      const data = await authApi.exportData()
      saveJson(data, `training-up-meus-dados-${new Date().toISOString().slice(0, 10)}.json`)
      toast({ title: t('privacy.exported') })
    } catch (e) {
      toast({ title: errorMessage(e, t), tone: 'error' })
    } finally {
      setExporting(false)
    }
  }

  const openDelete = () => {
    setPassword('')
    setWord('')
    setCode('')
    setError(null)
    setOpen(true)
  }

  const ready =
    (user.has_password ? password.length > 0 : word.trim() === DELETE_WORD) &&
    (!user.two_factor_enabled || code.trim().length > 0)

  const deleteAccount = async (e: FormEvent) => {
    e.preventDefault()
    setDeleting(true)
    setError(null)
    try {
      await authApi.deleteAccount({
        ...(user.has_password ? { password } : { confirmation: word.trim() }),
        ...(user.two_factor_enabled ? { code } : {}),
      })
      toast({ title: t('privacy.deleted') })
      await navigate(ROUTES.home, { replace: true })
      queryClient.removeQueries() // the user and every cached answer
    } catch (err) {
      const field =
        err instanceof ApiError
          ? (err.field('password') ?? err.field('confirmation') ?? err.field('code'))
          : undefined
      setError(field ?? errorMessage(err, t))
      setDeleting(false)
    }
  }

  return (
    <Card className="grid gap-5">
      <CardTitle>{t('privacy.title')}</CardTitle>

      <div className="grid gap-1">
        <button type="button" className={rowClass} onClick={exportData} disabled={exporting}>
          <span className="grid">
            <span className="font-semibold">{t('privacy.export')}</span>
            <span className="text-muted text-sm">{t('privacy.exportHint')}</span>
          </span>
          <Download className="text-muted size-5 shrink-0" aria-hidden />
        </button>
        <Link to={ROUTES.consents} className={rowClass}>
          <span className="grid">
            <span className="font-semibold">{t('privacy.consents')}</span>
            <span className="text-muted text-sm">{t('privacy.consentsHint')}</span>
          </span>
          <ChevronRight className="text-muted size-5 shrink-0" aria-hidden />
        </Link>
      </div>

      <nav aria-label={t('privacy.documents')} className="grid gap-2">
        <span className="text-muted text-xs font-semibold tracking-wider uppercase">
          {t('privacy.documents')}
        </span>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <li>
            <Link to={ROUTES.terms} className="font-semibold underline underline-offset-2">
              {t('legal.terms')}
            </Link>
          </li>
          <li>
            <Link to={ROUTES.privacy} className="font-semibold underline underline-offset-2">
              {t('legal.privacy')}
            </Link>
          </li>
          <li>
            <Link to={ROUTES.cookies} className="font-semibold underline underline-offset-2">
              {t('legal.cookies')}
            </Link>
          </li>
        </ul>
      </nav>

      <div className="border-border grid gap-3 border-t pt-5">
        <p className="text-muted text-sm">{t('privacy.deleteHint')}</p>
        <Button variant="danger" onClick={openDelete} className="w-fit">
          <Trash2 className="size-4" aria-hidden />
          {t('privacy.delete')}
        </Button>
      </div>

      <Modal
        open={open}
        onOpenChange={(o) => !deleting && setOpen(o)}
        title={t('privacy.deleteTitle')}
        description={t('privacy.deleteWarning')}
      >
        <form onSubmit={deleteAccount} noValidate className="grid gap-4">
          {error && <Alert tone="error">{error}</Alert>}
          {user.has_password ? (
            <Input
              label={t('privacy.deletePassword')}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          ) : (
            <Input
              label={t('privacy.deleteWord')}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={word}
              onChange={(e) => setWord(e.target.value)}
            />
          )}
          {user.two_factor_enabled && (
            <Input
              label={t('privacy.deleteCode')}
              autoComplete="one-time-code"
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          )}
          <Button type="submit" variant="danger" size="lg" fullWidth loading={deleting} disabled={!ready}>
            {t('privacy.deleteConfirm')}
          </Button>
        </form>
      </Modal>
    </Card>
  )
}
