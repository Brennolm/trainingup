import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeUser, mockApi, signedOut } from '../../test/mockApi'
import { renderRoute } from '../../test/render'

describe('Continuar com Google', () => {
  it.each(['/entrar', '/criar-conta'])('is offered on %s and starts the flow on the API', async (path) => {
    mockApi({ 'GET /api/user': signedOut })
    renderRoute(path)

    const link = await screen.findByRole('link', { name: 'Continuar com Google' })
    expect(link).toHaveAttribute('href', 'http://localhost:8010/auth/google/redirect')
  })

  it('explains when Google did not confirm the e-mail', async () => {
    mockApi({ 'GET /api/user': signedOut })
    renderRoute('/entrar?erro=google_email')

    expect(await screen.findByRole('alert')).toHaveTextContent('O Google não confirmou este e-mail')
  })

  it('explains a cancelled or failed Google sign-in', async () => {
    mockApi({ 'GET /api/user': signedOut })
    renderRoute('/entrar?erro=google')

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível entrar com o Google')
  })
})

describe('CompleteSignUpPage', () => {
  it('asks to start again when there is no Google sign-up in progress', async () => {
    mockApi({
      'GET /api/user': signedOut,
      'GET /api/auth/google/pending': { status: 404, body: { message: 'x' } },
    })
    renderRoute('/completar-cadastro')

    expect(await screen.findByText(/O tempo para concluir o cadastro acabou/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continuar com Google' })).toBeInTheDocument()
  })

  it('shows the Google account and finishes sign-up with birth date and terms', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedOut,
      'GET /api/auth/google/pending': { body: { data: { name: 'Ana Souza', email: 'ana@gmail.com' } } },
      'POST /api/auth/google/complete': {
        status: 201,
        body: { data: makeUser({ email: 'ana@gmail.com', google_linked: true, has_password: false }) },
      },
    })
    const { user, router } = renderRoute('/completar-cadastro')

    expect(await screen.findByText('ana@gmail.com')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Data de nascimento'), '1995-03-10')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Concluir cadastro' }))

    expect(await screen.findByText(/Ana!/)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/hoje')
    expect(callsTo('POST /api/auth/google/complete')[0].body).toEqual({
      birth_date: '1995-03-10',
      accept_terms: true,
    })
  })

  it('blocks people under 18 before calling the API', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedOut,
      'GET /api/auth/google/pending': { body: { data: { name: 'Ana', email: 'ana@gmail.com' } } },
    })
    const { user } = renderRoute('/completar-cadastro')
    await screen.findByText('ana@gmail.com')

    await user.type(screen.getByLabelText('Data de nascimento'), `${new Date().getFullYear() - 15}-06-01`)
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Concluir cadastro' }))

    expect(
      await screen.findByText('Você precisa ter 18 anos ou mais para usar o Training Up.'),
    ).toBeInTheDocument()
    expect(callsTo('POST /api/auth/google/complete')).toHaveLength(0)
  })
})
