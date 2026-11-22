import type { TFunction } from 'i18next'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '../../lib/api'

/** User-facing message for any error thrown by the API client. */
export function errorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return t('errors.network')
    if (error.status === 429) return error.message || t('errors.tooMany', { seconds: error.retryAfter ?? 60 })
    if (error.message && error.status < 500) return error.message
  }
  return t('errors.generic')
}

/**
 * Puts API validation errors on the matching form fields. Returns true when at least one field
 * error was applied (so the caller can skip a generic banner).
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Path<T>[],
): boolean {
  if (!(error instanceof ApiError) || error.status !== 422) return false
  let applied = false
  for (const field of fields) {
    const message = error.field(field)
    if (message) {
      setError(field, { type: 'server', message })
      applied = true
    }
  }
  return applied
}
