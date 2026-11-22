import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeUser, mockApi, signedIn } from '../../test/mockApi'
import { renderRoute } from '../../test/render'

describe('Perfil → Privacidade', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
  })
  afterEach(() => vi.restoreAllMocks())

  it('downloads my data as a JSON file', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser()),
      'GET /api/profile/export': { body: { account: { name: 'Ana Souza' } } },
    })
    const { user } = renderRoute('/perfil')

    await user.click(await screen.findByRole('button', { name: /Exportar meus dados/ }))

    expect(await screen.findByText('Arquivo baixado.')).toBeInTheDocument()
    expect(callsTo('GET /api/profile/export')).toHaveLength(1)
    expect(click).toHaveBeenCalled()
  })

  it('lists my consents with version, date and IP', async () => {
    mockApi({
      'GET /api/user': signedIn(makeUser()),
      'GET /api/consents': {
        body: {
          data: [
            {
              type: 'terms',
              version: '2026-11-22',
              accepted_at: '2026-11-22T15:30:00Z',
              ip_address: '10.0.0.1',
            },
            { type: 'privacy', version: '2026-11-22', accepted_at: '2026-11-22T15:30:00Z', ip_address: null },
          ],
        },
      },
    })
    const { user, router } = renderRoute('/perfil')

    await user.click(await screen.findByRole('link', { name: /Meus consentimentos/ }))

    expect(router.state.location.pathname).toBe('/perfil/consentimentos')
    const list = await screen.findByRole('list', { name: 'Meus consentimentos' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Termos de Uso')
    expect(items[0]).toHaveTextContent('Versão 2026-11-22')
    expect(items[0]).toHaveTextContent('IP 10.0.0.1')
    expect(items[1]).not.toHaveTextContent('IP')
  })

  it('deletes the account with the password and goes to the home page', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser()),
      'DELETE /api/profile': { body: { message: 'ok' } },
    })
    const { user, router } = renderRoute('/perfil')

    await user.click(await screen.findByRole('button', { name: 'Excluir conta' }))
    const dialog = await screen.findByRole('dialog', { name: 'Excluir conta' })
    const confirm = within(dialog).getByRole('button', { name: 'Excluir minha conta' })
    expect(confirm).toBeDisabled()

    await user.type(within(dialog).getByLabelText('Senha atual'), 'senha1234')
    await user.click(confirm)

    expect(await screen.findByText('Sua conta foi excluída.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
    expect(callsTo('DELETE /api/profile')[0].body).toEqual({ password: 'senha1234' })
  })

  it('asks Google-only accounts to type EXCLUIR, plus the code when 2FA is on', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(
        makeUser({ has_password: false, google_linked: true, two_factor_enabled: true }),
      ),
      'DELETE /api/profile': { body: { message: 'ok' } },
    })
    const { user } = renderRoute('/perfil')

    await user.click(await screen.findByRole('button', { name: 'Excluir conta' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByLabelText('Senha atual')).not.toBeInTheDocument()
    const confirm = within(dialog).getByRole('button', { name: 'Excluir minha conta' })

    await user.type(within(dialog).getByLabelText('Digite EXCLUIR para confirmar'), 'excluir')
    await user.type(within(dialog).getByLabelText('Código do app ou de recuperação'), '123456')
    expect(confirm).toBeDisabled()

    await user.clear(within(dialog).getByLabelText('Digite EXCLUIR para confirmar'))
    await user.type(within(dialog).getByLabelText('Digite EXCLUIR para confirmar'), 'EXCLUIR')
    await user.click(confirm)

    expect(await screen.findByText('Sua conta foi excluída.')).toBeInTheDocument()
    expect(callsTo('DELETE /api/profile')[0].body).toEqual({ confirmation: 'EXCLUIR', code: '123456' })
  })

  it('shows a wrong password and keeps the account', async () => {
    mockApi({
      'GET /api/user': signedIn(makeUser()),
      'DELETE /api/profile': {
        status: 422,
        body: { message: 'x', errors: { password: ['A senha informada está incorreta.'] } },
      },
    })
    const { user, router } = renderRoute('/perfil')

    await user.click(await screen.findByRole('button', { name: 'Excluir conta' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Senha atual'), 'errada123')
    await user.click(within(dialog).getByRole('button', { name: 'Excluir minha conta' }))

    expect(await within(dialog).findByText('A senha informada está incorreta.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/perfil')
  })
})

describe('Termos atualizados', () => {
  it('blocks the app until the new version is accepted', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser({ needs_legal_consent: true })),
      'POST /api/consents': { body: { data: makeUser({ needs_legal_consent: false }) } },
    })
    const { user } = renderRoute('/hoje')

    expect(await screen.findByRole('heading', { name: 'Atualizamos nossos termos' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Aceitar e continuar' }))
    expect(
      screen.getByText('Você precisa aceitar os Termos de Uso e a Política de Privacidade.'),
    ).toBeInTheDocument()
    expect(callsTo('POST /api/consents')).toHaveLength(0)

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Aceitar e continuar' }))

    expect(await screen.findByText(/Ana!/)).toBeInTheDocument()
    expect(callsTo('POST /api/consents')[0].body).toEqual({ accept_terms: true })
  })
})
