import { Cookie } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { readStorage, writeStorage } from '../lib/storage'
import { ROUTES } from '../routes'
import { Button } from './ui/Button'

// Bump the version when the cookie notice text changes materially, to show it again.
const COOKIE_NOTICE_KEY = 'tu-cookie-notice'
const COOKIE_NOTICE_VERSION = '1'

/**
 * First-visit cookie notice. The site uses only essential cookies, so this informs rather than
 * asks for consent (see docs/DECISIONS.md). Consent records arrive in phase 3.
 */
export function CookieBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(() => readStorage(COOKIE_NOTICE_KEY) !== COOKIE_NOTICE_VERSION)

  if (!visible) return null

  const dismiss = () => {
    writeStorage(COOKIE_NOTICE_KEY, COOKIE_NOTICE_VERSION)
    setVisible(false)
  }

  return (
    <section
      role="region"
      aria-label={t('cookieBanner.label')}
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
    >
      <div className="bg-surface ring-border mx-auto flex max-w-2xl flex-col gap-4 rounded-2xl p-4 shadow-2xl ring-1 sm:flex-row sm:items-center">
        <Cookie className="text-secondary hidden size-6 shrink-0 sm:block" aria-hidden />
        <p className="text-muted flex-1 text-sm">
          {t('cookieBanner.text')}{' '}
          <Link to={ROUTES.cookies} className="text-text font-semibold underline underline-offset-2">
            {t('cookieBanner.learnMore')}
          </Link>
        </p>
        <Button onClick={dismiss} className="shrink-0">
          {t('cookieBanner.accept')}
        </Button>
      </div>
    </section>
  )
}
