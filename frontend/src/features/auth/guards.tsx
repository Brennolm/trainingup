import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router'
import { LegalUpdatePage } from '../../pages/auth/LegalUpdatePage'
import { ROUTES } from '../../routes'
import { useMe } from './useAuth'

function FullScreenLoader() {
  const { t } = useTranslation()
  return (
    <div className="grid min-h-dvh place-items-center" role="status">
      <Loader2 className="text-primary size-8 animate-spin" aria-hidden />
      <span className="sr-only">{t('appPages.loading')}</span>
    </div>
  )
}

/** Signed-in users only; others go to sign-in and come back afterwards. */
export function RequireAuth() {
  const { data: user, isPending } = useMe()
  const location = useLocation()
  if (isPending) return <FullScreenLoader />
  if (!user) return <Navigate to={ROUTES.signIn} replace state={{ from: location.pathname }} />
  return <Outlet />
}

/**
 * The app requires a confirmed e-mail (SPEC 6.2) and acceptance of the current Terms and
 * Privacy Policy (asked again when they change). Use inside RequireAuth.
 */
export function RequireVerified() {
  const { data: user } = useMe()
  if (user && !user.email_verified) return <Navigate to={ROUTES.verifyEmail} replace />
  if (user?.needs_legal_consent) return <LegalUpdatePage />
  return <Outlet />
}

/** Sign-in/sign-up pages: signed-in users skip straight to the app. */
export function GuestOnly() {
  const { data: user, isPending } = useMe()
  if (isPending) return <FullScreenLoader />
  if (user) return <Navigate to={user.email_verified ? ROUTES.today : ROUTES.verifyEmail} replace />
  return <Outlet />
}
