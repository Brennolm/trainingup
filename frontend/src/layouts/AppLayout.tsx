import { Outlet } from 'react-router'
import { NAV_ITEMS } from '../components/navigation/navItems'
import { ImpersonationBar } from '../features/admin/ImpersonationBar'
import { AccountThemeSync } from '../features/auth/AccountThemeSync'
import { AppShell } from './AppShell'

/** Signed-in area: sidebar (desktop) / bottom nav (mobile) around the current page. */
export function AppLayout() {
  return (
    <>
      <ImpersonationBar />
      <AppShell items={NAV_ITEMS}>
        <AccountThemeSync />
        <Outlet />
      </AppShell>
    </>
  )
}
