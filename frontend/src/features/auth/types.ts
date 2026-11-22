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
  preferences: {
    theme: Theme
    weight_unit: WeightUnit
    length_unit: LengthUnit
    locale: string
  }
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
