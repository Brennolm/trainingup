// Public URLs (pt-BR paths, see SPEC 6.2 and docs/DECISIONS.md).
export const ROUTES = {
  home: '/',
  signIn: '/entrar',
  signUp: '/criar-conta',
  verifyEmail: '/verificar-email',
  forgotPassword: '/esqueci-senha',
  resetPassword: '/redefinir-senha',
  terms: '/termos',
  privacy: '/privacidade',
  cookies: '/cookies',
  // App (signed in + e-mail confirmed)
  today: '/hoje',
  workout: '/treino',
  diet: '/dieta',
  progress: '/progresso',
  profile: '/perfil',
} as const
