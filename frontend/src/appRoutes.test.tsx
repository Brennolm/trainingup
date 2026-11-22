import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { routes } from './appRoutes'
import { ThemeProvider } from './theme/ThemeProvider'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>,
  )
  return router
}

describe('routes', () => {
  it('serves the landing page at /', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Treino e dieta')
  })

  it.each(['/entrar', '/criar-conta', '/termos', '/privacidade', '/cookies'])(
    'shows a "coming soon" placeholder at %s until its phase',
    (path) => {
      renderAt(path)
      expect(screen.getByRole('heading', { level: 1, name: 'Em breve' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', '/')
    },
  )

  it('redirects unknown paths to the landing page', async () => {
    const router = renderAt('/nao-existe')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Treino e dieta')
    expect(router.state.location.pathname).toBe('/')
  })

  it('shows the cookie notice on every page', () => {
    renderAt('/entrar')
    expect(screen.getByRole('region', { name: 'Aviso de cookies' })).toBeInTheDocument()
  })
})
