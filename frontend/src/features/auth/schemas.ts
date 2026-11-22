import { z } from 'zod'

// Messages are i18n keys (resolved with t() where they are shown).
// Rules mirror the API (backend/app/Http/Requests/Auth, AppServiceProvider password policy).

export const MIN_AGE = 18

export const PASSWORD_RULES = [
  { key: 'minLength', test: (v: string) => v.length >= 8 },
  { key: 'letter', test: (v: string) => /\p{L}/u.test(v) },
  { key: 'number', test: (v: string) => /\d/.test(v) },
] as const

/** Age in full years on `today` for a YYYY-MM-DD birth date. */
export function ageOn(birthDate: string, today = new Date()): number {
  const [y, m, d] = birthDate.split('-').map(Number)
  let age = today.getFullYear() - y
  const beforeBirthday = today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)
  if (beforeBirthday) age -= 1
  return age
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d && y > 1900
}

const email = z.string().trim().min(1, 'validation.emailRequired').email('validation.emailInvalid')

const password = z
  .string()
  .min(1, 'validation.passwordRequired')
  .refine((v) => PASSWORD_RULES.every((r) => r.test(v)), 'validation.passwordWeak')

export const birthDate = z
  .string()
  .min(1, 'validation.birthDateRequired')
  .refine(isValidDate, 'validation.birthDateInvalid')
  .refine((v) => !isValidDate(v) || ageOn(v) >= MIN_AGE, 'validation.underage')

export const name = z.string().trim().min(2, 'validation.nameShort').max(100, 'validation.nameLong')

export const signUpSchema = z
  .object({
    name,
    email,
    password,
    password_confirmation: z.string().min(1, 'validation.confirmRequired'),
    birth_date: birthDate,
    accept_terms: z.boolean().refine((v) => v, 'validation.termsRequired'),
  })
  .refine((v) => v.password === v.password_confirmation, {
    path: ['password_confirmation'],
    message: 'validation.passwordMismatch',
  })

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'validation.passwordRequired'),
  remember: z.boolean(),
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({ password, password_confirmation: z.string().min(1, 'validation.confirmRequired') })
  .refine((v) => v.password === v.password_confirmation, {
    path: ['password_confirmation'],
    message: 'validation.passwordMismatch',
  })

export const profileSchema = z.object({ name, birth_date: birthDate })

export type SignUpValues = z.infer<typeof signUpSchema>
export type SignInValues = z.infer<typeof signInSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
export type ProfileValues = z.infer<typeof profileSchema>
