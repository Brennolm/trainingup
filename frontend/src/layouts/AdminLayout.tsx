import { ArrowLeft, BarChart3, BellRing, SlidersHorizontal, Users } from 'lucide-react'
import { Navigate, Outlet } from 'react-router'
import type { NavItem } from '../components/navigation/navItems'
import { AccountThemeSync } from '../features/auth/AccountThemeSync'
import { useMe } from '../features/auth/useAuth'
import { ROUTES } from '../routes'
import { AppShell } from './AppShell'

const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: ROUTES.admin, labelKey: 'admin.nav.metrics', icon: BarChart3, end: true },
  { to: ROUTES.adminUsers, labelKey: 'admin.nav.users', icon: Users },
  { to: ROUTES.adminAlerts, labelKey: 'admin.nav.alerts', icon: BellRing },
  { to: ROUTES.adminSettings, labelKey: 'admin.nav.settings', icon: SlidersHorizontal },
  { to: ROUTES.today, labelKey: 'admin.nav.backToApp', icon: ArrowLeft },
]

/** Admin panel (SPEC 6.5): admins only, and never while viewing as another user. */
export function AdminLayout() {
  const { data: user } = useMe()
  if (!user || user.role !== 'admin' || user.impersonation) return <Navigate to={ROUTES.today} replace />

  return (
    <AppShell items={ADMIN_NAV_ITEMS}>
      <AccountThemeSync />
      <Outlet />
    </AppShell>
  )
}
