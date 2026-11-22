import { describe, expect, it } from 'vitest'
import ptBR from './pt-BR.json'

function leaves(obj: unknown, prefix = ''): [string, unknown][] {
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k))
  }
  return [[prefix, obj]]
}

describe('pt-BR translations', () => {
  it('has no empty or non-string values', () => {
    const bad = leaves(ptBR).filter(([, v]) => typeof v !== 'string' || v.trim() === '')
    expect(bad).toEqual([])
  })
})
