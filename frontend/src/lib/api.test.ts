import { describe, expect, it, vi } from 'vitest'
import { mockApi } from '../test/mockApi'
import { api, ApiError } from './api'

describe('api client', () => {
  it('gets the CSRF cookie before a POST and sends the XSRF header with credentials', async () => {
    const { fetchMock, calls } = mockApi({ 'POST /api/auth/login': { body: { ok: true } } })

    await api.post('/api/auth/login', { email: 'a@b.com' })

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/sanctum\/csrf-cookie$/)
    expect(calls[0].headers['X-XSRF-TOKEN']).toBe('test-xsrf-token')
    expect((fetchMock.mock.calls[1][1] as RequestInit).credentials).toBe('include')
  })

  it('does not ask for a CSRF cookie on GET', async () => {
    const { fetchMock } = mockApi({ 'GET /api/user': { body: { data: {} } } })
    await api.get('/api/user')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('turns validation errors into an ApiError with field messages', async () => {
    mockApi({
      'POST /api/auth/register': {
        status: 422,
        body: { message: 'Dados inválidos', errors: { email: ['Já existe uma conta com este e-mail.'] } },
      },
    })

    const error = (await api.post('/api/auth/register', {}).catch((e: unknown) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.field('email')).toBe('Já existe uma conta com este e-mail.')
  })

  it('reports network failures as status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const error = (await api.get('/api/user').catch((e: unknown) => e)) as ApiError
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
  })

  it('refreshes the CSRF token once on 419 and retries', async () => {
    let attempts = 0
    const { fetchMock } = mockApi({
      'POST /api/auth/logout': () =>
        ++attempts === 1 ? { status: 419, body: { message: 'CSRF' } } : { body: {} },
    })

    await api.post('/api/auth/logout')

    expect(attempts).toBe(2)
    const csrfCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/sanctum/csrf-cookie'))
    expect(csrfCalls).toHaveLength(2)
  })
})
