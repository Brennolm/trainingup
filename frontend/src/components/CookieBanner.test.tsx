import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/render'
import { CookieBanner } from './CookieBanner'

describe('CookieBanner', () => {
  it('shows the notice on the first visit with a link to the cookie policy', () => {
    renderWithProviders(<CookieBanner />)
    const banner = screen.getByRole('region', { name: 'Aviso de cookies' })
    expect(banner).toHaveTextContent('cookies essenciais')
    expect(screen.getByRole('link', { name: 'Saiba mais' })).toHaveAttribute('href', '/cookies')
  })

  it('hides after "Entendi" and stays hidden on the next visit', async () => {
    const { user, unmount } = renderWithProviders(<CookieBanner />)
    await user.click(screen.getByRole('button', { name: 'Entendi' }))
    expect(screen.queryByRole('region', { name: 'Aviso de cookies' })).not.toBeInTheDocument()

    unmount()
    renderWithProviders(<CookieBanner />)
    expect(screen.queryByRole('region', { name: 'Aviso de cookies' })).not.toBeInTheDocument()
  })

  it('shows again when the stored notice version is outdated', () => {
    localStorage.setItem('tu-cookie-notice', '0')
    renderWithProviders(<CookieBanner />)
    expect(screen.getByRole('region', { name: 'Aviso de cookies' })).toBeInTheDocument()
  })
})
