import { Copy, Download } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/toastContext'
import { authApi, type TwoFactorSetup } from '../../features/auth/authApi'
import { CodeInput } from '../../features/auth/components/CodeInput'
import { errorMessage } from '../../features/auth/errors'
import type { User } from '../../features/auth/types'
import { useSetMe } from '../../features/auth/useAuth'
import { ApiError } from '../../lib/api'

type Step =
  | { kind: 'closed' }
  | { kind: 'enable-password' }
  | { kind: 'enable-scan'; setup: TwoFactorSetup }
  | { kind: 'codes'; codes: string[] }
  | { kind: 'regenerate' }
  | { kind: 'disable' }

/** Message of a 422 on one of the fields, or a general message. */
function failure(error: unknown, t: Parameters<typeof errorMessage>[1]) {
  if (error instanceof ApiError) {
    const field = error.field('code') ?? error.field('password')
    if (field) return field
  }
  return errorMessage(error, t)
}

/** Profile → Segurança → Verificação em duas etapas (authenticator app + recovery codes). */
export function TwoFactorSection({ user }: { user: User }) {
  const { t } = useTranslation()
  const toast = useToast()
  const setMe = useSetMe()
  const [step, setStep] = useState<Step>({ kind: 'closed' })
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const open = (next: Step) => {
    setPassword('')
    setCode('')
    setError(null)
    setStep(next)
  }
  const close = () => open({ kind: 'closed' })

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      setError(failure(e, t))
    } finally {
      setBusy(false)
    }
  }

  const startEnable = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => open({ kind: 'enable-scan', setup: await authApi.twoFactorStart(password) }))
  }

  const confirmEnable = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      const res = await authApi.twoFactorConfirm(code)
      setMe(res.data)
      open({ kind: 'codes', codes: res.recovery_codes })
      toast({ title: t('profile.twoFactor.enabled') })
    })
  }

  const regenerate = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      const res = await authApi.newRecoveryCodes(password)
      setMe(res.data)
      open({ kind: 'codes', codes: res.recovery_codes })
    })
  }

  const disable = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      setMe(await authApi.twoFactorDisable({ password, code }))
      close()
      toast({ title: t('profile.twoFactor.disabled') })
    })
  }

  const passwordField = (
    <Input
      label={t('profile.security.currentPassword')}
      type="password"
      autoComplete="current-password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
  )

  return (
    <section className="grid gap-3" aria-labelledby="security-2fa">
      <h3 id="security-2fa" className="font-semibold">
        {t('profile.twoFactor.title')}
      </h3>
      <p className="text-muted text-sm">
        {user.two_factor_enabled
          ? t('profile.twoFactor.on', { count: user.recovery_codes_left ?? 0 })
          : t('profile.twoFactor.off')}
      </p>
      {user.two_factor_enabled && (user.recovery_codes_left ?? 0) <= 2 && (
        <Alert tone="warning">{t('profile.twoFactor.fewCodes')}</Alert>
      )}

      {!user.has_password ? (
        <p className="text-muted text-sm">{t('profile.twoFactor.needsPassword')}</p>
      ) : user.two_factor_enabled ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => open({ kind: 'regenerate' })}>
            {t('profile.twoFactor.newCodes')}
          </Button>
          <Button variant="secondary" onClick={() => open({ kind: 'disable' })}>
            {t('profile.twoFactor.disable')}
          </Button>
        </div>
      ) : (
        <Button variant="secondary" className="w-fit" onClick={() => open({ kind: 'enable-password' })}>
          {t('profile.twoFactor.enable')}
        </Button>
      )}

      <Modal
        open={step.kind === 'enable-password'}
        onOpenChange={(o) => !o && close()}
        title={t('profile.twoFactor.enableTitle')}
        description={t('profile.twoFactor.enablePasswordHint')}
      >
        <form onSubmit={startEnable} noValidate className="grid gap-4">
          {error && <Alert tone="error">{error}</Alert>}
          {passwordField}
          <Button type="submit" size="lg" fullWidth loading={busy} disabled={!password}>
            {t('common.continue')}
          </Button>
        </form>
      </Modal>

      <Modal
        open={step.kind === 'enable-scan'}
        onOpenChange={(o) => !o && close()}
        title={t('profile.twoFactor.enableTitle')}
        description={t('profile.twoFactor.scanHint')}
      >
        {step.kind === 'enable-scan' && (
          <form onSubmit={confirmEnable} noValidate className="grid gap-4">
            <img
              src={`data:image/svg+xml;utf8,${encodeURIComponent(step.setup.qr_svg)}`}
              alt={t('profile.twoFactor.qrAlt')}
              className="mx-auto size-56 rounded-xl"
            />
            <div className="grid gap-1 text-center">
              <span className="text-muted text-sm">{t('profile.twoFactor.manualKey')}</span>
              <code className="bg-surface-2 rounded-lg px-3 py-2 font-mono text-sm break-all select-all">
                {step.setup.secret.replace(/(.{4})/g, '$1 ').trim()}
              </code>
            </div>
            {error && <Alert tone="error">{error}</Alert>}
            <label className="grid gap-2">
              <span className="font-semibold">{t('profile.twoFactor.confirmLabel')}</span>
              <CodeInput value={code} onChange={setCode} invalid={!!error} />
            </label>
            <Button type="submit" size="lg" fullWidth loading={busy} disabled={code.length !== 6}>
              {t('profile.twoFactor.confirm')}
            </Button>
          </form>
        )}
      </Modal>

      <Modal
        open={step.kind === 'codes'}
        onOpenChange={(o) => !o && close()}
        title={t('profile.twoFactor.codesTitle')}
        description={t('profile.twoFactor.codesHint')}
      >
        {step.kind === 'codes' && <RecoveryCodes codes={step.codes} onDone={close} />}
      </Modal>

      <Modal
        open={step.kind === 'regenerate'}
        onOpenChange={(o) => !o && close()}
        title={t('profile.twoFactor.newCodes')}
        description={t('profile.twoFactor.newCodesHint')}
      >
        <form onSubmit={regenerate} noValidate className="grid gap-4">
          {error && <Alert tone="error">{error}</Alert>}
          {passwordField}
          <Button type="submit" size="lg" fullWidth loading={busy} disabled={!password}>
            {t('profile.twoFactor.newCodes')}
          </Button>
        </form>
      </Modal>

      <Modal
        open={step.kind === 'disable'}
        onOpenChange={(o) => !o && close()}
        title={t('profile.twoFactor.disableTitle')}
        description={t('profile.twoFactor.disableHint')}
      >
        <form onSubmit={disable} noValidate className="grid gap-4">
          {error && <Alert tone="error">{error}</Alert>}
          {passwordField}
          <Input
            label={t('profile.twoFactor.disableCodeLabel')}
            autoComplete="one-time-code"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button type="submit" size="lg" fullWidth loading={busy} disabled={!password || !code.trim()}>
            {t('profile.twoFactor.disable')}
          </Button>
        </form>
      </Modal>
    </section>
  )
}

function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const { t } = useTranslation()
  const toast = useToast()
  const text = codes.join('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: t('profile.twoFactor.copied') })
    } catch {
      toast({ title: t('errors.generic') })
    }
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([`${t('profile.twoFactor.fileHeader')}\n\n${text}\n`]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'training-up-codigos-de-recuperacao.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-4">
      <ul
        aria-label={t('profile.twoFactor.codesTitle')}
        className="bg-surface-2 grid grid-cols-2 gap-2 rounded-xl p-4 font-mono text-sm"
      >
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={copy}>
          <Copy className="size-4" aria-hidden /> {t('profile.twoFactor.copy')}
        </Button>
        <Button variant="secondary" onClick={download}>
          <Download className="size-4" aria-hidden /> {t('profile.twoFactor.download')}
        </Button>
      </div>
      <Button size="lg" fullWidth onClick={onDone}>
        {t('profile.twoFactor.saved')}
      </Button>
    </div>
  )
}
