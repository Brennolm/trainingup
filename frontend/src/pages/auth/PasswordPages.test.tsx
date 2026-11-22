import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, signedOut } from '../../test/mockApi'
import { renderRoute } from '../../test/render'

const SENT = 'Se houver uma conta com este e-mail, enviamos um link para redefinir a senha.'

describe('ForgotPasswordPage', () => {
  it('sends the link and shows the same answer for any e-mail', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedOut,
      'POST /api/auth/forgot-password': { body: { message: SENT } },
    })
    const { user } = renderRoute('/esqueci-senha')
    await screen.findByRole('heading', { name: 'Esqueci minha senha' })

    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.click(screen.getByRole('button', { name: 'Enviar link' }))

    expect(await screen.findByText(SENT)).toBeInTheDocument()
    expect(callsTo('POST /api/auth/forgot-password')[0].body).toEqual({ email: 'ana@example.com' })
  })
})

describe('ResetPasswordPage', () => {
  it('explains an incomplete link', async () => {
    mockApi({})
    renderRoute('/redefinir-senha')
    expect(
      await screen.findByText('Este link está incompleto. Peça um novo link de redefinição.'),
    ).toBeInTheDocument()
  })

  it('saves the new password with the token from the link', async () => {
    const { callsTo } = mockApi({
      'POST /api/auth/reset-password': {
        body: { message: 'Senha redefinida. Você já pode entrar com a nova senha.' },
      },
    })
    const { user } = renderRoute('/redefinir-senha?token=abc&email=ana%40example.com')
    await screen.findByRole('heading', { name: 'Criar nova senha' })

    await user.type(screen.getByLabelText('Nova senha'), 'novaSenha9')
    await user.type(screen.getByLabelText('Confirme a senha'), 'novaSenha9')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(await screen.findByRole('heading', { name: 'Senha redefinida' })).toBeInTheDocument()
    expect(callsTo('POST /api/auth/reset-password')[0].body).toEqual({
      token: 'abc',
      email: 'ana@example.com',
      password: 'novaSenha9',
      password_confirmation: 'novaSenha9',
    })
  })

  it('shows an expired-link error with a way to ask for a new one', async () => {
    mockApi({
      'POST /api/auth/reset-password': {
        status: 422,
        body: {
          message: 'Erro',
          errors: { token: ['Este link de redefinição é inválido ou expirou. Peça um novo link.'] },
        },
      },
    })
    const { user } = renderRoute('/redefinir-senha?token=old&email=ana%40example.com')
    await screen.findByRole('heading', { name: 'Criar nova senha' })

    await user.type(screen.getByLabelText('Nova senha'), 'novaSenha9')
    await user.type(screen.getByLabelText('Confirme a senha'), 'novaSenha9')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('expirou')
    expect(screen.getByRole('link', { name: 'Pedir novo link' })).toHaveAttribute('href', '/esqueci-senha')
  })
})
