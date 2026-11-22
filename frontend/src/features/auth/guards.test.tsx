import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeUser, mockApi, signedIn, signedOut } from '../../test/mockApi'
import { renderRoute } from '../../test/render'

describe('route guards', () => {
  it('sends guests from the app to sign-in', async () => {
    mockApi({ 'GET /api/user': signedOut })
    const { router } = renderRoute('/perfil')
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/entrar')
  })

  it('keeps unverified users on the verification page', async () => {
    mockApi({ 'GET /api/user': signedIn(makeUser({ email_verified: false })) })
    const { router } = renderRoute('/hoje')
    expect(await screen.findByRole('heading', { name: 'Confirme seu e-mail' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/verificar-email')
  })

  it('sends signed-in users away from sign-in and sign-up', async () => {
    mockApi({ 'GET /api/user': signedIn(makeUser()) })
    const { router } = renderRoute('/criar-conta')
    expect(await screen.findByText(/Ana!/)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/hoje')
  })

  it('shows the app with its five sections to verified users', async () => {
    mockApi({ 'GET /api/user': signedIn(makeUser()) })
    renderRoute('/hoje')
    expect(await screen.findByText(/Ana!/)).toBeInTheDocument()
    for (const name of ['Hoje', 'Treino', 'Dieta', 'Progresso', 'Perfil']) {
      expect(screen.getAllByRole('link', { name }).length).toBeGreaterThan(0)
    }
  })
})
