import type { Theme } from '../../theme/themeContext'

export type WeightUnit = 'kg' | 'lb'
export type LengthUnit = 'cm' | 'ft_in'

export type User = {
  id: number
  name: string
  email: string
  email_verified: boolean
  birth_date: string | null
  role: 'user' | 'admin'
  plan: string | null
  has_password: boolean
  google_linked: boolean
  two_factor_enabled: boolean
  /** Unused recovery codes; null while 2FA is off. */
  recovery_codes_left: number | null
  /** The Terms or the Privacy Policy changed since the last acceptance. */
  needs_legal_consent: boolean
  /** An admin is viewing this account read-only (SPEC 6.5); null otherwise. */
  impersonation: { admin_name: string; expires_at: string } | null
  preferences: {
    theme: Theme
    weight_unit: WeightUnit
    length_unit: LengthUnit
    locale: string
  }
}

export type Consent = {
  type: 'terms' | 'privacy' | 'health_data' | 'cookies'
  version: string
  accepted_at: string
  ip_address: string | null
}

export type RegisterInput = {
  name: string
  email: string
  password: string
  password_confirmation: string
  birth_date: string
  accept_terms: boolean
}

export type Preferences = Partial<Pick<User['preferences'], 'theme' | 'weight_unit' | 'length_unit'>>
