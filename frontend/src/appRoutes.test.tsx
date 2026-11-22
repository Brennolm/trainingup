import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, signedOut } from './test/mockApi'
import { renderRoute } from './test/render'

describe('routes', () => {
  it('serves the landing page at /', () => {
    renderRoute('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Treino e dieta')
  })

  it.each([
    ['/termos', 'Termos de Uso'],
    ['/privacidade', 'Política de Privacidade'],
    ['/cookies', 'Política de Cookies'],
  ])('serves the legal document at %s', (path, title) => {
    renderRoute(path)
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
  })

  it.each([
    ['/entrar', 'Entrar'],
    ['/criar-conta', 'Criar conta'],
    ['/esqueci-senha', 'Esqueci minha senha'],
  ])('serves the sign-in pages (%s)', async (path, heading) => {
    mockApi({ 'GET /api/user': signedOut })
    renderRoute(path)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
  })

  it('redirects unknown paths to the landing page', async () => {
    const { router } = renderRoute('/nao-existe')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Treino e dieta')
    expect(router.state.location.pathname).toBe('/')
  })

  it('shows the cookie notice on every page', () => {
    renderRoute('/termos')
    expect(screen.getByRole('region', { name: 'Aviso de cookies' })).toBeInTheDocument()
  })
})
