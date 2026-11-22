import { describe, expect, it } from 'vitest'
import { buttonClasses } from '../components/ui/buttonStyles'
import { cn } from './cn'

describe('cn', () => {
  it('lets later classes override conflicting earlier ones', () => {
    expect(cn('inline-flex px-5', 'hidden px-4')).toBe('hidden px-4')
  })

  it('keeps responsive overrides passed to buttons', () => {
    const classes = buttonClasses({ className: 'hidden sm:inline-flex' }).split(' ')
    expect(classes).toContain('hidden')
    expect(classes).toContain('sm:inline-flex')
    expect(classes).not.toContain('inline-flex')
  })

  it('understands the custom color tokens', () => {
    expect(cn('bg-primary text-on-primary', 'bg-on-primary text-primary')).toBe('bg-on-primary text-primary')
  })
})
