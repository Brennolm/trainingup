import { Navigate, type RouteObject } from 'react-router'
import { RootLayout } from './layouts/RootLayout'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { DesignSystemRoute } from './pages/DesignSystemRoute'
import { LandingPage } from './pages/landing/LandingPage'
import { ROUTES } from './routes'

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { path: ROUTES.home, element: <LandingPage /> },
      // Placeholders until phase 2 (auth) and phase 3 (legal pages).
      { path: ROUTES.signIn, element: <ComingSoonPage /> },
      { path: ROUTES.signUp, element: <ComingSoonPage /> },
      { path: ROUTES.terms, element: <ComingSoonPage /> },
      { path: ROUTES.privacy, element: <ComingSoonPage /> },
      { path: ROUTES.cookies, element: <ComingSoonPage /> },
      { path: '/design/*', element: <DesignSystemRoute /> },
      { path: '*', element: <Navigate to={ROUTES.home} replace /> },
    ],
  },
]
