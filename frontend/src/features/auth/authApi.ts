import { api, API_URL, ApiError } from '../../lib/api'
import type { Preferences, RegisterInput, User } from './types'

type UserResponse = { data: User }
type MessageResponse = { message: string; retry_after?: number }

export const authApi = {
  /** Current user, or null when signed out (the API answers data: null for guests). */
  async me(): Promise<User | null> {
    try {
      return (await api.get<{ data: User | null }>('/api/user')).data
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null
      throw e
    }
  },

  async register(input: RegisterInput) {
    return api.post<UserResponse & { meta: { verification_email_sent: boolean } }>(
      '/api/auth/register',
      input,
    )
  },

  async login(input: { email: string; password: string; remember: boolean }) {
    return (await api.post<UserResponse>('/api/auth/login', input)).data
  },

  logout: () => api.post<MessageResponse>('/api/auth/logout'),

  async verifyEmail(code: string) {
    return (await api.post<MessageResponse & UserResponse>('/api/auth/email/verify', { code })).data
  },

  resendCode: () => api.post<MessageResponse>('/api/auth/email/resend'),

  forgotPassword: (email: string) => api.post<MessageResponse>('/api/auth/forgot-password', { email }),

  resetPassword: (input: { token: string; email: string; password: string; password_confirmation: string }) =>
    api.post<MessageResponse>('/api/auth/reset-password', input),

  async updateProfile(input: { name: string; birth_date: string }) {
    return (await api.patch<UserResponse>('/api/profile', input)).data
  },

  async updatePreferences(input: Preferences) {
    return (await api.patch<UserResponse>('/api/profile/preferences', input)).data
  },

  async googlePending(): Promise<{ name: string; email: string } | null> {
    try {
      return (await api.get<{ data: { name: string; email: string } }>('/api/auth/google/pending')).data
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  },

  async googleComplete(input: { birth_date: string; accept_terms: boolean }) {
    return (await api.post<UserResponse>('/api/auth/google/complete', input)).data
  },

  async googleUnlink() {
    return (await api.delete<UserResponse>('/api/auth/google')).data
  },

  async changePassword(input: {
    current_password?: string
    password: string
    password_confirmation: string
  }) {
    return (await api.put<UserResponse>('/api/profile/password', input)).data
  },
}

/** Full-page URL that starts "Continuar com Google" (intent=link connects it to the signed-in account). */
export function googleRedirectUrl(intent: 'login' | 'link' = 'login'): string {
  return `${API_URL}/auth/google/redirect${intent === 'link' ? '?intent=link' : ''}`
}
