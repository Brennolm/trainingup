import { describe, expect, it } from 'vitest'
import { ageOn, signUpSchema } from './schemas'

const valid = {
  name: 'Ana Souza',
  email: 'ana@example.com',
  password: 'senha1234',
  password_confirmation: 'senha1234',
  birth_date: '1995-03-10',
  accept_terms: true,
}

function firstError(values: Record<string, unknown>, field: string) {
  const result = signUpSchema.safeParse(values)
  return result.success ? undefined : result.error.issues.find((i) => i.path[0] === field)?.message
}

describe('ageOn', () => {
  const today = new Date(2026, 10, 22) // 22 Nov 2026

  it('counts full years only', () => {
    expect(ageOn('2008-11-22', today)).toBe(18)
    expect(ageOn('2008-11-23', today)).toBe(17)
    expect(ageOn('2008-12-01', today)).toBe(17)
    expect(ageOn('1990-01-01', today)).toBe(36)
  })
})

describe('signUpSchema', () => {
  it('accepts a valid sign-up', () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true)
  })

  it('requires 8+ characters with a letter and a number', () => {
    for (const pw of ['abc123', '12345678', 'abcdefgh']) {
      expect(firstError({ ...valid, password: pw, password_confirmation: pw }, 'password')).toBe(
        'validation.passwordWeak',
      )
    }
  })

  it('requires matching confirmation', () => {
    expect(firstError({ ...valid, password_confirmation: 'outra1234' }, 'password_confirmation')).toBe(
      'validation.passwordMismatch',
    )
  })

  it('blocks people under 18', () => {
    const now = new Date()
    const almost18 = `${now.getFullYear() - 18}-12-31`
    const expected = ageOn(almost18) < 18 ? 'validation.underage' : undefined
    expect(firstError({ ...valid, birth_date: almost18 }, 'birth_date')).toBe(expected)
    expect(firstError({ ...valid, birth_date: `${now.getFullYear() - 10}-01-01` }, 'birth_date')).toBe(
      'validation.underage',
    )
  })

  it('rejects impossible dates', () => {
    expect(firstError({ ...valid, birth_date: '1990-02-31' }, 'birth_date')).toBe(
      'validation.birthDateInvalid',
    )
  })

  it('requires accepting the terms', () => {
    expect(firstError({ ...valid, accept_terms: false }, 'accept_terms')).toBe('validation.termsRequired')
  })
})
