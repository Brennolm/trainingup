import { describe, expect, it } from 'vitest'
import { cmToFtIn, formatLength, formatWeight, ftInToCm, kgToLb, lbToKg } from './units'

describe('units', () => {
  it('converts kg ⇄ lb without drift', () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 3)
    expect(lbToKg(kgToLb(78.4))).toBeCloseTo(78.4, 10)
  })

  it('converts cm ⇄ feet and inches', () => {
    expect(cmToFtIn(175)).toEqual({ ft: 5, in: 9 })
    expect(cmToFtIn(182.88)).toEqual({ ft: 6, in: 0 })
    expect(ftInToCm(5, 9)).toBeCloseTo(175.26, 2)
  })

  it('formats with the pt-BR decimal comma', () => {
    expect(formatWeight(78.4, 'kg')).toBe('78,4 kg')
    expect(formatWeight(78.4, 'lb')).toBe('172,8 lb')
    expect(formatLength(175, 'cm')).toBe('175 cm')
    expect(formatLength(175, 'ft_in')).toBe('5′ 9″')
  })
})
