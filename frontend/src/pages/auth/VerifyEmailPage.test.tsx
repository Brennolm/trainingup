import { act, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeUser, mockApi, signedIn } from '../../test/mockApi'
import { renderRoute } from '../../test/render'

const unverified = makeUser({ email_verified: false })

describe('VerifyEmailPage', () => {
  it('submits automatically after 6 digits and opens the app', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(unverified),
      'POST /api/auth/email/verify': { body: { message: 'E-mail confirmado.', data: makeUser() } },
    })
    const { user, router } = renderRoute('/verificar-email')
    await screen.findByRole('heading', { name: 'Confirme seu e-mail' })

    await user.type(screen.getByLabelText('Código de verificação'), '12a3456')

    expect(await screen.findByText(/Ana!/)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/hoje')
    expect(callsTo('POST /api/auth/email/verify')[0].body).toEqual({ code: '123456' })
  })

  it('shows why a code was refused', async () => {
    mockApi({
      'GET /api/user': signedIn(unverified),
      'POST /api/auth/email/verify': {
        status: 422,
        body: {
          message: 'Código incorreto. Confira e tente de novo.',
          code: 'invalid',
          errors: { code: ['Código incorreto. Confira e tente de novo.'] },
        },
      },
    })
    const { user } = renderRoute('/verificar-email')
    await screen.findByRole('heading', { name: 'Confirme seu e-mail' })

    await user.type(screen.getByLabelText('Código de verificação'), '000000')

    expect(await screen.findByText('Código incorreto. Confira e tente de novo.')).toBeInTheDocument()
    expect(screen.getByLabelText('Código de verificação')).toHaveAttribute('aria-invalid', 'true')
  })

  it('allows resending only after 60 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(unverified),
      'POST /api/auth/email/resend': { body: { message: 'Enviamos um novo código.', retry_after: 60 } },
    })
    const { user } = renderRoute('/verificar-email')
    await screen.findByRole('heading', { name: 'Confirme seu e-mail' })

    expect(screen.getByRole('button', { name: 'Reenviar em 60 s' })).toBeDisabled()

    // One tick per second, like the real countdown.
    for (let i = 0; i < 60; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })
    }
    await user.click(screen.getByRole('button', { name: 'Reenviar código' }))

    expect(await screen.findByText('Enviamos um novo código.')).toBeInTheDocument()
    expect(callsTo('POST /api/auth/email/resend')).toHaveLength(1)
    expect(screen.getByRole('button', { name: /Reenviar em/ })).toBeDisabled()
  })

  it('warns when the first e-mail could not be sent', async () => {
    mockApi({ 'GET /api/user': signedIn(unverified) })
    renderRoute('/verificar-email', { emailSent: false })

    expect(
      await screen.findByText('Não conseguimos enviar o código. Toque em Reenviar código.'),
    ).toBeInTheDocument()
  })
})
