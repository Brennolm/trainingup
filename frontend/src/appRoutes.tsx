import { Navigate, type RouteObject } from 'react-router'
import { GuestOnly, RequireAuth, RequireVerified } from './features/auth/guards'
import { AppLayout } from './layouts/AppLayout'
import { RootLayout } from './layouts/RootLayout'
import { AppSoonPage } from './pages/app/AppSoonPage'
import { ProfilePage } from './pages/app/ProfilePage'
import { TodayPage } from './pages/app/TodayPage'
import { CompleteSignUpPage } from './pages/auth/CompleteSignUpPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { SignInPage } from './pages/auth/SignInPage'
import { SignUpPage } from './pages/auth/SignUpPage'
import { TwoFactorChallengePage } from './pages/auth/TwoFactorChallengePage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { DesignSystemRoute } from './pages/DesignSystemRoute'
import { LandingPage } from './pages/landing/LandingPage'
import { ROUTES } from './routes'

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { path: ROUTES.home, element: <LandingPage /> },

      // Signed-out only
      {
        element: <GuestOnly />,
        children: [
          { path: ROUTES.signIn, element: <SignInPage /> },
          { path: ROUTES.twoFactor, element: <TwoFactorChallengePage /> },
          { path: ROUTES.signUp, element: <SignUpPage /> },
          { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
          { path: ROUTES.completeSignUp, element: <CompleteSignUpPage /> },
        ],
      },
      { path: ROUTES.resetPassword, element: <ResetPasswordPage /> },

      // Signed in
      {
        element: <RequireAuth />,
        children: [
          { path: ROUTES.verifyEmail, element: <VerifyEmailPage /> },
          {
            element: <RequireVerified />,
            children: [
              {
                element: <AppLayout />,
                children: [
                  { path: ROUTES.today, element: <TodayPage /> },
                  { path: ROUTES.workout, element: <AppSoonPage titleKey="nav.workout" /> },
                  { path: ROUTES.diet, element: <AppSoonPage titleKey="nav.diet" /> },
                  { path: ROUTES.progress, element: <AppSoonPage titleKey="nav.progress" /> },
                  { path: ROUTES.profile, element: <ProfilePage /> },
                ],
              },
            ],
          },
        ],
      },

      // Legal pages arrive in phase 3.
      { path: ROUTES.terms, element: <ComingSoonPage /> },
      { path: ROUTES.privacy, element: <ComingSoonPage /> },
      { path: ROUTES.cookies, element: <ComingSoonPage /> },
      { path: '/design/*', element: <DesignSystemRoute /> },
      { path: '*', element: <Navigate to={ROUTES.home} replace /> },
    ],
  },
]
