import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { renderWithProviders } from '../test/render'

describe('ThemeProvider', () => {
  it('uses the dark theme by default', () => {
    renderWithProviders(<ThemeToggle />)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('restores the theme saved in localStorage', () => {
    localStorage.setItem('tu-theme', 'light')
    renderWithProviders(<ThemeToggle />)
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('ignores an invalid saved value', () => {
    localStorage.setItem('tu-theme', 'purple')
    renderWithProviders(<ThemeToggle />)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('toggles the theme, persists it and updates the browser theme color', async () => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)

    const { user } = renderWithProviders(<ThemeToggle />)
    await user.click(screen.getByRole('button', { name: 'Alternar tema' }))

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('tu-theme')).toBe('light')
    expect(meta.getAttribute('content')).toBe('#F7F6F4')

    await user.click(screen.getByRole('button', { name: 'Alternar tema' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    meta.remove()
  })
})
