import { Outlet } from 'react-router'
import { AccountThemeSync } from '../features/auth/AccountThemeSync'
import { NAV_ITEMS } from '../components/navigation/navItems'
import { AppShell } from './AppShell'

/** Signed-in area: sidebar (desktop) / bottom nav (mobile) around the current page. */
export function AppLayout() {
  return (
    <AppShell items={NAV_ITEMS}>
      <AccountThemeSync />
      <Outlet />
    </AppShell>
  )
}
