import { Navigate, type RouteObject } from 'react-router'
import { GuestOnly, RequireAuth, RequireVerified } from './features/auth/guards'
import { AdminLayout } from './layouts/AdminLayout'
import { AppLayout } from './layouts/AppLayout'
import { AdminAlertsPage } from './pages/admin/AdminAlertsPage'
import { AdminMetricsPage } from './pages/admin/AdminMetricsPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { RootLayout } from './layouts/RootLayout'
import { AppSoonPage } from './pages/app/AppSoonPage'
import { ConsentsPage } from './pages/app/ConsentsPage'
import { MyDataPage, MyDataSectionPage } from './pages/app/MyDataPage'
import { ProfilePage } from './pages/app/ProfilePage'
import { QuestionnairePage } from './pages/app/QuestionnairePage'
import { TodayPage } from './pages/app/TodayPage'
import { CompleteSignUpPage } from './pages/auth/CompleteSignUpPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { SignInPage } from './pages/auth/SignInPage'
import { SignUpPage } from './pages/auth/SignUpPage'
import { TwoFactorChallengePage } from './pages/auth/TwoFactorChallengePage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'
import { DesignSystemRoute } from './pages/DesignSystemRoute'
import { LandingPage } from './pages/landing/LandingPage'
import { LegalPage } from './pages/legal/LegalPage'
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
                  { path: ROUTES.consents, element: <ConsentsPage /> },
                  { path: ROUTES.questionnaire, element: <QuestionnairePage /> },
                  { path: ROUTES.myData, element: <MyDataPage /> },
                  { path: ROUTES.myDataSection, element: <MyDataSectionPage /> },
                ],
              },
              {
                element: <AdminLayout />,
                children: [
                  { path: ROUTES.admin, element: <AdminMetricsPage /> },
                  { path: ROUTES.adminUsers, element: <AdminUsersPage /> },
                  { path: ROUTES.adminAlerts, element: <AdminAlertsPage /> },
                  { path: ROUTES.adminSettings, element: <AdminSettingsPage /> },
                ],
              },
            ],
          },
        ],
      },

      // Legal documents (texts: locales/pt-BR.json → legalDocs).
      { path: ROUTES.terms, element: <LegalPage doc="terms" /> },
      { path: ROUTES.privacy, element: <LegalPage doc="privacy" /> },
      { path: ROUTES.cookies, element: <LegalPage doc="cookies" /> },
      { path: '/design/*', element: <DesignSystemRoute /> },
      { path: '*', element: <Navigate to={ROUTES.home} replace /> },
    ],
  },
]
