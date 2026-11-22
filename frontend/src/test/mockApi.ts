import { vi } from 'vitest'
import type { User } from '../features/auth/types'

type Reply = { status?: number; body?: unknown }
type Handler = Reply | ((body: Record<string, unknown> | undefined) => Reply)

export type ApiCall = {
  method: string
  path: string
  body: Record<string, unknown> | undefined
  headers: Record<string, string>
}

/**
 * Replaces fetch with a fake Laravel API. Keys are "METHOD /path".
 * The Sanctum CSRF endpoint is handled automatically.
 */
export function mockApi(handlers: Record<string, Handler>) {
  const calls: ApiCall[] = []
  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const { pathname } = new URL(url)
    const method = init.method ?? 'GET'
    if (pathname === '/sanctum/csrf-cookie') {
      document.cookie = 'XSRF-TOKEN=test-xsrf-token; path=/'
      return new Response(null, { status: 204 })
    }
    const body = init.body ? (JSON.parse(init.body as string) as Record<string, unknown>) : undefined
    calls.push({ method, path: pathname, body, headers: (init.headers ?? {}) as Record<string, string> })

    const handler = handlers[`${method} ${pathname}`]
    if (!handler) {
      return new Response(JSON.stringify({ message: `Not mocked: ${method} ${pathname}` }), { status: 500 })
    }
    const reply = typeof handler === 'function' ? handler(body) : handler
    return new Response(reply.body === undefined ? '' : JSON.stringify(reply.body), {
      status: reply.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return { calls, fetchMock, callsTo: (key: string) => calls.filter((c) => `${c.method} ${c.path}` === key) }
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Ana Souza',
    email: 'ana@example.com',
    email_verified: true,
    birth_date: '1995-03-10',
    role: 'user',
    plan: 'free',
    has_password: true,
    google_linked: false,
    two_factor_enabled: false,
    recovery_codes_left: null,
    preferences: { theme: 'dark', weight_unit: 'kg', length_unit: 'cm', locale: 'pt_BR' },
    ...overrides,
  }
}

export const signedOut: Handler = { body: { data: null } }
export const signedIn = (user: User): Handler => ({ body: { data: user } })
