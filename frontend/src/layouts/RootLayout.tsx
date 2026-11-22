import { Outlet } from 'react-router'
import { CookieBanner } from '../components/CookieBanner'

// Wraps every page: shows the first-visit cookie notice.
export function RootLayout() {
  return (
    <>
      <Outlet />
      <CookieBanner />
    </>
  )
}
