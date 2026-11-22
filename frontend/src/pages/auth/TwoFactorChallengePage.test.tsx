import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeUser, mockApi, signedOut } from '../../test/mockApi'
import { renderRoute } from '../../test/render'

async function signInWithPassword(user: ReturnType<typeof renderRoute>['user']) {
  await user.type(await screen.findByLabelText('E-mail'), 'ana@example.com')
  await user.type(screen.getByLabelText('Senha'), 'senha1234')
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('Entrar com verificação em duas etapas', () => {
  it('asks for the app code after the password and signs in with it', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedOut,
      'POST /api/auth/login': { body: { two_factor: true } },
      'POST /api/auth/two-factor-challenge': {
        body: { data: makeUser({ two_factor_enabled: true, recovery_codes_left: 8 }) },
      },
    })
    const { user, router } = renderRoute('/entrar')

    await signInWithPassword(user)
    expect(
      await screen.findByText('Digite o código de 6 dígitos do seu app autenticador.'),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/entrar/codigo')

    // Sends on its own once the 6th digit is typed.
    await user.type(screen.getByLabelText('Código do app'), '123456')

    expect(await screen.findByText(/Ana!/)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/hoje')
    expect(callsTo('POST /api/auth/two-factor-challenge')[0].body).toEqual({ code: '123456' })
  })

  it('shows a wrong code and lets the user try again', async () => {
    mockApi({
      'GET /api/user': signedOut,
      'POST /api/auth/two-factor-challenge': {
        status: 422,
        body: {
          message: 'x',
          errors: { code: ['Código incorreto. Confira no app autenticador e tente de novo.'] },
        },
      },
    })
    const { user } = renderRoute('/entrar/codigo')

    await user.type(await screen.findByLabelText('Código do app'), '000000')

    expect(
      await screen.findByText('Código incorreto. Confira no app autenticador e tente de novo.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Código do app')).toBeEnabled()
  })

  it('accepts a recovery code', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedOut,
      'POST /api/auth/two-factor-challenge': { body: { data: makeUser({ two_factor_enabled: true }) } },
    })
    const { user, router } = renderRoute('/entrar/codigo')

    await user.click(await screen.findByRole('button', { name: 'Usar um código de recuperação' }))
    await user.type(screen.getByLabelText('Código de recuperação'), 'ABCDE-FGH23')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText(/Ana!/)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/hoje')
    expect(callsTo('POST /api/auth/two-factor-challenge')[0].body).toEqual({ code: 'ABCDE-FGH23' })
  })

  it('sends back to sign in when the step expired', async () => {
    mockApi({
      'GET /api/user': signedOut,
      'POST /api/auth/two-factor-challenge': {
        status: 422,
        body: {
          message: 'O tempo para digitar o código acabou. Entre com e-mail e senha de novo.',
          code: 'two_factor_expired',
        },
      },
    })
    const { user } = renderRoute('/entrar/codigo')

    await user.type(await screen.findByLabelText('Código do app'), '123456')

    expect(await screen.findByText(/O tempo para digitar o código acabou/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Código do app')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para Entrar' })).toHaveAttribute('href', '/entrar')
  })
})
