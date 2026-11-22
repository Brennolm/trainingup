import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeUser, mockApi, signedIn, signedOut } from '../../test/mockApi'
import { renderRoute } from '../../test/render'

describe('ProfilePage', () => {
  it('shows personal data with the e-mail read-only', async () => {
    mockApi({ 'GET /api/user': signedIn(makeUser()) })
    renderRoute('/perfil')
    await screen.findByRole('heading', { name: 'Perfil' })

    expect(screen.getByLabelText('Nome')).toHaveValue('Ana Souza')
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Data de nascimento')).toHaveValue('1995-03-10')
  })

  it('saves name changes', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser()),
      'PATCH /api/profile': (body) => ({ body: { data: makeUser({ name: String(body?.name) }) } }),
    })
    const { user } = renderRoute('/perfil')
    await screen.findByRole('heading', { name: 'Perfil' })

    await user.clear(screen.getByLabelText('Nome'))
    await user.type(screen.getByLabelText('Nome'), 'Ana Lima')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Dados salvos.')).toBeInTheDocument()
    expect(callsTo('PATCH /api/profile')[0].body).toEqual({ name: 'Ana Lima', birth_date: '1995-03-10' })
  })

  it('saves unit preferences to the account', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser()),
      'PATCH /api/profile/preferences': (body) => ({
        body: { data: makeUser({ preferences: { ...makeUser().preferences, ...body } }) },
      }),
    })
    const { user } = renderRoute('/perfil')
    await screen.findByRole('heading', { name: 'Perfil' })

    await user.click(screen.getByRole('radio', { name: 'Libras (lb)' }))

    await waitFor(() => expect(callsTo('PATCH /api/profile/preferences')).toHaveLength(1))
    expect(callsTo('PATCH /api/profile/preferences')[0].body).toEqual({ weight_unit: 'lb' })
    expect(screen.getByRole('radio', { name: 'Libras (lb)' })).toBeChecked()
  })

  it('applies the account theme on sign-in and saves theme changes', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser({ preferences: { ...makeUser().preferences, theme: 'light' } })),
      'PATCH /api/profile/preferences': (body) => ({
        body: { data: makeUser({ preferences: { ...makeUser().preferences, ...body } }) },
      }),
    })
    const { user } = renderRoute('/perfil')
    await screen.findByRole('heading', { name: 'Perfil' })

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'))
    expect(callsTo('PATCH /api/profile/preferences')).toHaveLength(0)

    await user.click(screen.getByRole('radio', { name: 'Escuro' }))

    await waitFor(() => expect(callsTo('PATCH /api/profile/preferences')).toHaveLength(1))
    expect(callsTo('PATCH /api/profile/preferences')[0].body).toEqual({ theme: 'dark' })
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('signs out and returns to the landing page', async () => {
    let signedInNow = true
    const { callsTo } = mockApi({
      'GET /api/user': () => (signedInNow ? signedIn(makeUser()) : signedOut) as never,
      'POST /api/auth/logout': () => {
        signedInNow = false
        return { body: { message: 'Você saiu da sua conta.' } }
      },
    })
    const { user, router } = renderRoute('/perfil')
    await screen.findByRole('heading', { name: 'Perfil' })

    await user.click(screen.getByRole('button', { name: 'Sair da conta' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(callsTo('POST /api/auth/logout')).toHaveLength(1)

    // Signed out for real: the sign-in page is reachable again (no redirect back to the app).
    await router.navigate('/entrar')
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })
})
