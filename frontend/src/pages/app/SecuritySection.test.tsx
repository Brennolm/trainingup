import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeUser, mockApi, signedIn } from '../../test/mockApi'
import { renderRoute } from '../../test/render'

describe('Perfil → Segurança', () => {
  it('offers to link Google when it is not linked', async () => {
    mockApi({ 'GET /api/user': signedIn(makeUser()) })
    renderRoute('/perfil')

    const link = await screen.findByRole('link', { name: 'Vincular Google' })
    expect(link).toHaveAttribute('href', 'http://localhost:8010/auth/google/redirect?intent=link')
  })

  it('confirms when Google was linked', async () => {
    mockApi({ 'GET /api/user': signedIn(makeUser({ google_linked: true })) })
    renderRoute('/perfil?google=vinculado')

    expect(await screen.findByText('Google vinculado à sua conta.')).toBeInTheDocument()
  })

  it('warns when the Google account belongs to another user', async () => {
    mockApi({ 'GET /api/user': signedIn(makeUser()) })
    renderRoute('/perfil?google=em_uso')

    expect(await screen.findByText(/já está ligada a outro usuário/)).toBeInTheDocument()
  })

  it('does not let Google-only accounts unlink before creating a password', async () => {
    mockApi({ 'GET /api/user': signedIn(makeUser({ google_linked: true, has_password: false })) })
    renderRoute('/perfil')

    expect(await screen.findByRole('button', { name: 'Desvincular' })).toBeDisabled()
    expect(screen.getByText('Crie uma senha abaixo antes de desvincular o Google.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Criar senha' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Senha atual')).not.toBeInTheDocument()
  })

  it('unlinks Google when the account has a password', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser({ google_linked: true })),
      'DELETE /api/auth/google': { body: { data: makeUser({ google_linked: false }) } },
    })
    const { user } = renderRoute('/perfil')

    await user.click(await screen.findByRole('button', { name: 'Desvincular' }))

    expect(await screen.findByText('Google desvinculado.')).toBeInTheDocument()
    expect(callsTo('DELETE /api/auth/google')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Vincular Google' })).toBeInTheDocument()
  })

  it('creates a password for a Google-only account', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser({ google_linked: true, has_password: false })),
      'PUT /api/profile/password': { body: { data: makeUser({ google_linked: true, has_password: true }) } },
    })
    const { user } = renderRoute('/perfil')
    await screen.findByRole('heading', { name: 'Criar senha' })

    await user.type(screen.getByLabelText('Nova senha'), 'novaSenha9')
    await user.type(screen.getByLabelText('Confirme a senha'), 'novaSenha9')
    await user.click(screen.getByRole('button', { name: 'Salvar senha' }))

    expect(await screen.findByText('Senha salva.')).toBeInTheDocument()
    expect(callsTo('PUT /api/profile/password')[0].body).toEqual({
      password: 'novaSenha9',
      password_confirmation: 'novaSenha9',
    })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Desvincular' })).toBeEnabled())
  })

  it('changes the password with the current one and shows a wrong-password error', async () => {
    mockApi({
      'GET /api/user': signedIn(makeUser()),
      'PUT /api/profile/password': {
        status: 422,
        body: { message: 'x', errors: { current_password: ['A senha informada está incorreta.'] } },
      },
    })
    const { user } = renderRoute('/perfil')
    await screen.findByRole('heading', { name: 'Alterar senha' })

    await user.type(screen.getByLabelText('Senha atual'), 'errada123')
    await user.type(screen.getByLabelText('Nova senha'), 'novaSenha9')
    await user.type(screen.getByLabelText('Confirme a senha'), 'novaSenha9')
    await user.click(screen.getByRole('button', { name: 'Salvar senha' }))

    expect(await screen.findByText('A senha informada está incorreta.')).toBeInTheDocument()
  })
})
