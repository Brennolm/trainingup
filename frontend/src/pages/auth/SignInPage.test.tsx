import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeUser, mockApi, signedOut } from '../../test/mockApi'
import { renderRoute } from '../../test/render'

async function signIn(user: ReturnType<typeof renderRoute>['user']) {
  await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
  await user.type(screen.getByLabelText('Senha'), 'senha1234')
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('SignInPage', () => {
  it('has "Manter conectado" checked by default and links to password recovery', async () => {
    mockApi({ 'GET /api/user': signedOut })
    renderRoute('/entrar')
    await screen.findByRole('heading', { name: 'Entrar' })

    expect(screen.getByRole('checkbox', { name: 'Manter conectado' })).toBeChecked()
    expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute(
      'href',
      '/esqueci-senha',
    )
  })

  it('shows a single message for wrong credentials', async () => {
    mockApi({
      'GET /api/user': signedOut,
      'POST /api/auth/login': {
        status: 422,
        body: { message: 'E-mail ou senha incorretos.', errors: { email: ['E-mail ou senha incorretos.'] } },
      },
    })
    const { user } = renderRoute('/entrar')
    await screen.findByRole('heading', { name: 'Entrar' })

    await signIn(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
  })

  it('sends verified users to "Hoje"', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedOut,
      'POST /api/auth/login': { body: { data: makeUser() } },
    })
    const { user, router } = renderRoute('/entrar')
    await screen.findByRole('heading', { name: 'Entrar' })

    await signIn(user)

    expect(await screen.findByText(/Ana!/)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/hoje')
    expect(callsTo('POST /api/auth/login')[0].body).toEqual({
      email: 'ana@example.com',
      password: 'senha1234',
      remember: true,
    })
  })

  it('sends unverified users to e-mail verification', async () => {
    mockApi({
      'GET /api/user': signedOut,
      'POST /api/auth/login': { body: { data: makeUser({ email_verified: false }) } },
    })
    const { user, router } = renderRoute('/entrar')
    await screen.findByRole('heading', { name: 'Entrar' })

    await signIn(user)

    expect(await screen.findByRole('heading', { name: 'Confirme seu e-mail' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/verificar-email')
  })

  it('explains connection problems', async () => {
    mockApi({ 'GET /api/user': signedOut })
    const { user } = renderRoute('/entrar')
    await screen.findByRole('heading', { name: 'Entrar' })
    const { vi } = await import('vitest')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))

    await signIn(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Sem conexão com o servidor')
  })
})
