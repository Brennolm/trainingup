// SPEC 2.3: the database always stores metric (kg, cm). Convert only for display and input.
import type { LengthUnit, WeightUnit } from '../features/auth/types'

const LB_PER_KG = 2.20462262185
const CM_PER_INCH = 2.54

export const kgToLb = (kg: number) => kg * LB_PER_KG
export const lbToKg = (lb: number) => lb / LB_PER_KG

export function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalInches = Math.round(cm / CM_PER_INCH)
  return { ft: Math.floor(totalInches / 12), in: totalInches % 12 }
}

export const ftInToCm = (ft: number, inches: number) => (ft * 12 + inches) * CM_PER_INCH

/** "78,4 kg" or "172,8 lb" (locale-aware decimals). */
export function formatWeight(kg: number, unit: WeightUnit, locale = 'pt-BR'): string {
  const value = unit === 'lb' ? kgToLb(kg) : kg
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${unit}`
}

/** "175 cm" or "5′ 9″". */
export function formatLength(cm: number, unit: LengthUnit, locale = 'pt-BR'): string {
  if (unit === 'ft_in') {
    const { ft, in: inches } = cmToFtIn(cm)
    return `${ft}′ ${inches}″`
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(cm)} cm`
}
