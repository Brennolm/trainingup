// HTTP client for the Laravel API (Sanctum SPA auth: session cookie + XSRF token).
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8010'

export type FieldErrors = Record<string, string[]>

export class ApiError extends Error {
  status: number
  errors: FieldErrors
  code?: string
  retryAfter?: number

  constructor(status: number, message: string, body: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = (body.errors as FieldErrors | undefined) ?? {}
    this.code = body.code as string | undefined
    this.retryAfter = body.retry_after as number | undefined
  }

  /** First message for a field, if the API rejected it. */
  field(name: string): string | undefined {
    return this.errors[name]?.[0]
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

let csrfReady: Promise<void> | null = null

/** Gets the XSRF-TOKEN cookie once (and again after a 419). */
function ensureCsrf(force = false): Promise<void> {
  if (force || !csrfReady || !readCookie('XSRF-TOKEN')) {
    csrfReady = fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' }).then(
      () => undefined,
      (error: unknown) => {
        csrfReady = null // don't cache a failure (e.g. offline): try again next time
        throw error
      },
    )
  }
  return csrfReady
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

async function request<T>(method: Method, path: string, body?: unknown, retried = false): Promise<T> {
  const mutating = method !== 'GET'
  if (mutating) {
    try {
      await ensureCsrf()
    } catch {
      throw new ApiError(0, 'network')
    }
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  // FormData (file uploads) sets its own multipart Content-Type with the boundary.
  const isForm = body instanceof FormData
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  const xsrf = readCookie('XSRF-TOKEN')
  if (mutating && xsrf) headers['X-XSRF-TOKEN'] = xsrf

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'network')
  }

  // Expired CSRF token (e.g. after a long idle period): refresh once and retry.
  if (response.status === 419 && !retried) {
    await ensureCsrf(true)
    return request<T>(method, path, body, true)
  }

  const text = await response.text()
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : {}

  if (!response.ok) {
    throw new ApiError(response.status, (data.message as string | undefined) ?? '', data)
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string, body?: unknown) => request<T>('DELETE', path, body),
  /** Sends one file as multipart/form-data under `field`. */
  upload: <T>(path: string, file: File, field = 'file') => {
    const form = new FormData()
    form.append(field, file)
    return request<T>('POST', path, form)
  },
}

/** Test helper: forget the cached CSRF state. */
export function resetCsrfForTests() {
  csrfReady = null
}
