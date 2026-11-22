import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeUser, mockApi, signedIn } from '../../test/mockApi'
import { renderRoute } from '../../test/render'

const CODES = [
  'AAAAA-BBBBB',
  'CCCCC-DDDDD',
  'EEEEE-FFFFF',
  'GGGGG-HHHHH',
  'JJJJJ-KKKKK',
  'MMMMM-NNNNN',
  'PPPPP-QQQQQ',
  'RRRRR-SSSSS',
]
const enabledUser = (left = 8) => makeUser({ two_factor_enabled: true, recovery_codes_left: left })

describe('Perfil → Verificação em duas etapas', () => {
  it('enables 2FA: password → QR code → code → recovery codes', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser()),
      'POST /api/profile/two-factor': {
        body: {
          data: { secret: 'JBSWY3DPEHPK3PXP', otpauth_url: 'otpauth://totp/x', qr_svg: '<svg></svg>' },
        },
      },
      'POST /api/profile/two-factor/confirm': { body: { data: enabledUser(), recovery_codes: CODES } },
    })
    const { user } = renderRoute('/perfil')

    await user.click(await screen.findByRole('button', { name: 'Ativar' }))
    let dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Senha atual'), 'senha1234')
    await user.click(within(dialog).getByRole('button', { name: 'Continuar' }))

    dialog = await screen.findByRole('dialog', { name: 'Ativar verificação' })
    expect(await within(dialog).findByRole('img', { name: /QR code/ })).toBeInTheDocument()
    expect(within(dialog).getByText('JBSW Y3DP EHPK 3PXP')).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('Código do app'), '123456')
    await user.click(within(dialog).getByRole('button', { name: 'Ativar verificação' }))

    dialog = await screen.findByRole('dialog', { name: 'Códigos de recuperação' })
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(8)
    expect(within(dialog).getByText('AAAAA-BBBBB')).toBeInTheDocument()
    expect(callsTo('POST /api/profile/two-factor')[0].body).toEqual({ password: 'senha1234' })
    expect(callsTo('POST /api/profile/two-factor/confirm')[0].body).toEqual({ code: '123456' })

    await user.click(within(dialog).getByRole('button', { name: 'Já guardei os códigos' }))
    expect(await screen.findByText('Ativa. Restam 8 códigos de recuperação.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows a wrong password while enabling', async () => {
    mockApi({
      'GET /api/user': signedIn(makeUser()),
      'POST /api/profile/two-factor': {
        status: 422,
        body: { message: 'x', errors: { password: ['A senha informada está incorreta.'] } },
      },
    })
    const { user } = renderRoute('/perfil')

    await user.click(await screen.findByRole('button', { name: 'Ativar' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Senha atual'), 'errada123')
    await user.click(within(dialog).getByRole('button', { name: 'Continuar' }))

    expect(await within(dialog).findByText('A senha informada está incorreta.')).toBeInTheDocument()
  })

  it('asks Google-only accounts to create a password first', async () => {
    mockApi({ 'GET /api/user': signedIn(makeUser({ has_password: false, google_linked: true })) })
    renderRoute('/perfil')

    expect(await screen.findByText(/Crie uma senha abaixo para poder ativar/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ativar' })).not.toBeInTheDocument()
  })

  it('warns when few recovery codes are left', async () => {
    mockApi({ 'GET /api/user': signedIn(enabledUser(1)) })
    renderRoute('/perfil')

    expect(await screen.findByText('Ativa. Resta 1 código de recuperação.')).toBeInTheDocument()
    expect(screen.getByText(/Poucos códigos de recuperação/)).toBeInTheDocument()
  })

  it('disables with password and code', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(enabledUser()),
      'DELETE /api/profile/two-factor': { body: { data: makeUser() } },
    })
    const { user } = renderRoute('/perfil')

    await user.click(await screen.findByRole('button', { name: 'Desativar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Desativar verificação' })
    await user.type(within(dialog).getByLabelText('Senha atual'), 'senha1234')
    await user.type(within(dialog).getByLabelText('Código do app ou de recuperação'), '123456')
    await user.click(within(dialog).getByRole('button', { name: 'Desativar' }))

    expect(await screen.findByText('Verificação em duas etapas desativada.')).toBeInTheDocument()
    expect(callsTo('DELETE /api/profile/two-factor')[0].body).toEqual({
      password: 'senha1234',
      code: '123456',
    })
    expect(screen.getByRole('button', { name: 'Ativar' })).toBeInTheDocument()
  })

  it('generates new recovery codes', async () => {
    mockApi({
      'GET /api/user': signedIn(enabledUser(2)),
      'POST /api/profile/two-factor/recovery-codes': {
        body: { data: enabledUser(8), recovery_codes: CODES },
      },
    })
    const { user } = renderRoute('/perfil')

    await user.click(await screen.findByRole('button', { name: 'Gerar novos códigos' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Senha atual'), 'senha1234')
    await user.click(within(dialog).getByRole('button', { name: 'Gerar novos códigos' }))

    expect(await screen.findByRole('dialog', { name: 'Códigos de recuperação' })).toBeInTheDocument()
    expect(screen.getByText('Ativa. Restam 8 códigos de recuperação.')).toBeInTheDocument()
  })
})
