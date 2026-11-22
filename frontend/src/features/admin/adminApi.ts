import { api } from '../../lib/api'

export type Metrics = {
  users_total: number
  users_verified: number
  signups_7d: number
  signups_30d: number
  active_7d: number
  questionnaires_completed: number
  screenings_blocked: number
  /** null until the phase that creates them (8 and 10). */
  plans_generated: number | null
  sessions_logged: number | null
  open_alerts: number
}

export type AdminUser = {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  status: 'active' | 'unverified'
  created_at: string | null
  last_seen_at: string | null
}

export type UsersPage = {
  data: AdminUser[]
  meta: { current_page: number; last_page: number; total: number }
}

export type ImpersonationLog = {
  id: number
  admin: string | null
  user: { name: string; email: string } | null
  reason: string
  started_at: string
  ended_at: string | null
}

export type AlertType = 'app_error' | 'backup_failed' | 'mail_failed' | 'deploy_failed'

export type AdminAlert = {
  id: number
  type: AlertType
  message: string
  occurrences: number
  first_occurred_at: string | null
  last_occurred_at: string
  resolved_at: string | null
}

export type Setting = {
  key: string
  value: number
  default: number
  min: number
  max: number
  step: number
  unit: '%' | 'kcal' | 'g/kg' | 'bmi' | null
}

export const adminApi = {
  metrics: async () => (await api.get<{ data: Metrics }>('/api/admin/metrics')).data,

  users: (page: number, search: string) =>
    api.get<UsersPage>(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`),

  logs: async () => (await api.get<{ data: ImpersonationLog[] }>('/api/admin/impersonation-logs')).data,

  impersonate: (userId: number, reason: string) =>
    api.post<{ message: string }>(`/api/admin/users/${userId}/impersonate`, { reason }),

  stopImpersonation: () => api.delete<{ message: string }>('/api/admin/impersonation'),

  alerts: async (status: 'open' | 'resolved') =>
    (await api.get<{ data: AdminAlert[] }>(`/api/admin/alerts?status=${status}`)).data,

  resolveAlert: async (id: number) =>
    (await api.post<{ data: AdminAlert }>(`/api/admin/alerts/${id}/resolve`)).data,

  settings: async () => (await api.get<{ data: Setting[] }>('/api/admin/settings')).data,

  saveSettings: (values: { key: string; value: number }[]) =>
    api.put<{ data: Setting[]; message: string }>('/api/admin/settings', { values }),
}

/**
 * Entering or leaving "Ver como usuário" switches whose data the whole app shows: a full page load
 * guarantees nothing cached from the other account stays on screen. Tests replace `go`.
 */
export const pageLoad = {
  go(path: string) {
    window.location.assign(path)
  },
}
