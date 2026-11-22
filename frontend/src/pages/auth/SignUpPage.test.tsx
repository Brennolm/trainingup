import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeUser, mockApi, signedOut } from '../../test/mockApi'
import { renderRoute } from '../../test/render'

async function fillValidForm(user: ReturnType<typeof renderRoute>['user']) {
  await user.type(screen.getByLabelText('Nome'), 'Ana Souza')
  await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
  await user.type(screen.getByLabelText('Senha'), 'senha1234')
  await user.type(screen.getByLabelText('Confirme a senha'), 'senha1234')
  await user.type(screen.getByLabelText('Data de nascimento'), '1995-03-10')
  await user.click(screen.getByRole('checkbox'))
}

describe('SignUpPage', () => {
  it('shows the password requirements turning green as the user types', async () => {
    mockApi({ 'GET /api/user': signedOut })
    const { user } = renderRoute('/criar-conta')
    await screen.findByRole('heading', { name: 'Criar conta' })

    const rules = screen.getByText('A senha precisa ter:').parentElement!
    expect(within(rules).getAllByText('(pendente)')).toHaveLength(3)

    await user.type(screen.getByLabelText('Senha'), 'abc12345')
    expect(within(rules).getAllByText('(atendido)')).toHaveLength(3)
  })

  it('validates before calling the API', async () => {
    const { callsTo } = mockApi({ 'GET /api/user': signedOut })
    const { user } = renderRoute('/criar-conta')
    await screen.findByRole('heading', { name: 'Criar conta' })

    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Informe seu nome.')).toBeInTheDocument()
    expect(screen.getByText('Informe seu e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua data de nascimento.')).toBeInTheDocument()
    expect(
      screen.getByText('Você precisa aceitar os Termos de Uso e a Política de Privacidade.'),
    ).toBeInTheDocument()
    expect(callsTo('POST /api/auth/register')).toHaveLength(0)
  })

  it('blocks people under 18', async () => {
    mockApi({ 'GET /api/user': signedOut })
    const { user } = renderRoute('/criar-conta')
    await screen.findByRole('heading', { name: 'Criar conta' })

    await user.type(screen.getByLabelText('Data de nascimento'), `${new Date().getFullYear() - 15}-01-01`)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(
      await screen.findByText('Você precisa ter 18 anos ou mais para usar o Training Up.'),
    ).toBeInTheDocument()
  })

  it('links the terms and privacy policy from the consent checkbox', async () => {
    mockApi({ 'GET /api/user': signedOut })
    renderRoute('/criar-conta')
    await screen.findByRole('heading', { name: 'Criar conta' })

    expect(screen.getByRole('link', { name: 'Termos de Uso' })).toHaveAttribute('href', '/termos')
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute(
      'href',
      '/privacidade',
    )
  })

  it('creates the account and goes to e-mail verification', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedOut,
      'POST /api/auth/register': {
        status: 201,
        body: { data: makeUser({ email_verified: false }), meta: { verification_email_sent: true } },
      },
    })
    const { user, router } = renderRoute('/criar-conta')
    await screen.findByRole('heading', { name: 'Criar conta' })

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('heading', { name: 'Confirme seu e-mail' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/verificar-email')
    expect(screen.getByText('ana@example.com')).toBeInTheDocument()
    expect(callsTo('POST /api/auth/register')[0].body).toMatchObject({
      name: 'Ana Souza',
      email: 'ana@example.com',
      birth_date: '1995-03-10',
      accept_terms: true,
    })
  })

  it('shows the server error on the e-mail field', async () => {
    mockApi({
      'GET /api/user': signedOut,
      'POST /api/auth/register': {
        status: 422,
        body: { message: 'Erro', errors: { email: ['Já existe uma conta com este e-mail.'] } },
      },
    })
    const { user } = renderRoute('/criar-conta')
    await screen.findByRole('heading', { name: 'Criar conta' })

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Já existe uma conta com este e-mail.')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
  })
})
