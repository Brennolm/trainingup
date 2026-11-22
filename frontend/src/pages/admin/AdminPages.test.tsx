import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pageLoad, type Setting } from '../../features/admin/adminApi'
import { makeUser, mockApi, signedIn } from '../../test/mockApi'
import { renderRoute } from '../../test/render'

const admin = makeUser({ id: 9, name: 'Brenno Leite', role: 'admin' })

const metrics = {
  users_total: 1284,
  users_verified: 1200,
  signups_7d: 40,
  signups_30d: 150,
  active_7d: 310,
  questionnaires_completed: 800,
  screenings_blocked: 35,
  plans_generated: null,
  sessions_logged: null,
  open_alerts: 2,
}

const settings: Setting[] = [
  { key: 'protein.lose_fat', value: 2, default: 2, min: 0.5, max: 4, step: 0.1, unit: 'g/kg' },
  { key: 'activity.sedentary.low', value: 1.375, default: 1.375, min: 1, max: 2.5, step: 0.005, unit: null },
]

afterEach(() => vi.restoreAllMocks())

describe('Painel admin', () => {
  it('is only for admins', async () => {
    mockApi({ 'GET /api/user': signedIn(makeUser()) })
    const { router } = renderRoute('/admin')

    await screen.findByText(/Ana!/)
    expect(router.state.location.pathname).toBe('/hoje')
  })

  it('is linked from the profile and shows the metrics', async () => {
    mockApi({ 'GET /api/user': signedIn(admin), 'GET /api/admin/metrics': { body: { data: metrics } } })
    const { user, router } = renderRoute('/perfil')

    await user.click(await screen.findByRole('link', { name: /Painel admin/ }))
    expect(router.state.location.pathname).toBe('/admin')

    expect(await screen.findByText('1,3 mil')).toBeInTheDocument() // compact
    expect(screen.getByText('de 1284')).toBeInTheDocument()
    expect(screen.getAllByText('Em breve')).toHaveLength(2)
    expect(screen.getByRole('link', { name: '2 alertas abertos' })).toHaveAttribute('href', '/admin/alertas')
  })

  it('lists and searches users', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(admin),
      'GET /api/admin/users': {
        body: {
          data: [
            {
              id: 1,
              name: 'Ana Souza',
              email: 'ana@example.com',
              role: 'user',
              status: 'unverified',
              created_at: '2026-11-20T10:00:00Z',
              last_seen_at: null,
            },
            {
              id: 9,
              name: 'Brenno Leite',
              email: 'b@example.com',
              role: 'admin',
              status: 'active',
              created_at: '2026-11-19T10:00:00Z',
              last_seen_at: '2026-11-22T10:00:00Z',
            },
          ],
          meta: { current_page: 1, last_page: 1, total: 2 },
        },
      },
    })
    const { user } = renderRoute('/admin/usuarios')

    const list = await screen.findByRole('list', { name: 'Usuários' })
    const [ana, brenno] = within(list).getAllByRole('listitem')
    expect(ana).toHaveTextContent('E-mail não confirmado')
    expect(ana).toHaveTextContent('nunca acessou')
    expect(within(ana).getByRole('button', { name: 'Ver como usuário' })).toBeInTheDocument()
    expect(within(brenno).queryByRole('button', { name: 'Ver como usuário' })).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Buscar por nome ou e-mail'), 'ana')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    await vi.waitFor(() => expect(callsTo('GET /api/admin/users')).toHaveLength(2))
  })

  it('asks a reason before viewing as a user, then reloads into the app', async () => {
    const go = vi.spyOn(pageLoad, 'go').mockImplementation(() => {})
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(admin),
      'GET /api/admin/users': {
        body: {
          data: [
            {
              id: 1,
              name: 'Ana Souza',
              email: 'ana@example.com',
              role: 'user',
              status: 'active',
              created_at: null,
              last_seen_at: null,
            },
          ],
          meta: { current_page: 1, last_page: 1, total: 1 },
        },
      },
      'POST /api/admin/users/1/impersonate': { body: { message: 'ok' } },
    })
    const { user } = renderRoute('/admin/usuarios')

    await user.click(await screen.findByRole('button', { name: 'Ver como usuário' }))
    const dialog = await screen.findByRole('dialog', { name: 'Ver como Ana Souza' })
    await user.type(within(dialog).getByLabelText('Motivo do acesso'), 'ajuda')
    await user.click(within(dialog).getByRole('button', { name: 'Entrar em modo leitura' }))
    expect(within(dialog).getByText('Descreva o motivo com pelo menos 10 caracteres.')).toBeInTheDocument()
    expect(callsTo('POST /api/admin/users/1/impersonate')).toHaveLength(0)

    await user.type(within(dialog).getByLabelText('Motivo do acesso'), ' com o questionário')
    await user.click(within(dialog).getByRole('button', { name: 'Entrar em modo leitura' }))

    await vi.waitFor(() => expect(go).toHaveBeenCalledWith('/hoje'))
    expect(callsTo('POST /api/admin/users/1/impersonate')[0].body).toEqual({
      reason: 'ajuda com o questionário',
    })
  })

  it('shows the support access log', async () => {
    mockApi({
      'GET /api/user': signedIn(admin),
      'GET /api/admin/users': { body: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } } },
      'GET /api/admin/impersonation-logs': {
        body: {
          data: [
            {
              id: 1,
              admin: 'Brenno Leite',
              user: null,
              reason: 'Erro no login',
              started_at: '2026-11-22T10:00:00Z',
              ended_at: null,
            },
          ],
        },
      },
    })
    const { user } = renderRoute('/admin/usuarios')

    await user.click(await screen.findByRole('tab', { name: 'Registro de acessos' }))
    const item = within(await screen.findByRole('list', { name: 'Registro de acessos' })).getByRole(
      'listitem',
    )
    expect(item).toHaveTextContent('Conta excluída')
    expect(item).toHaveTextContent('“Erro no login”')
    expect(item).toHaveTextContent('Por Brenno Leite')
    expect(item).toHaveTextContent('até agora')
  })

  it('marks an alert as resolved', async () => {
    let resolved = false
    const alert = {
      id: 5,
      type: 'backup_failed',
      message: 'Database backup failed: access denied',
      occurrences: 3,
      first_occurred_at: '2026-11-20T03:00:00Z',
      last_occurred_at: '2026-11-22T03:00:00Z',
      resolved_at: null,
    }
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(admin),
      'GET /api/admin/alerts': () => ({ body: { data: resolved ? [] : [alert] } }),
      'POST /api/admin/alerts/5/resolve': () => {
        resolved = true
        return { body: { data: { ...alert, resolved_at: '2026-11-22T12:00:00Z' } } }
      },
    })
    const { user } = renderRoute('/admin/alertas')

    const item = within(await screen.findByRole('list', { name: 'Abertos' })).getByRole('listitem')
    expect(item).toHaveTextContent('Falha no backup')
    expect(item).toHaveTextContent('3 ocorrências')
    await user.click(within(item).getByRole('button', { name: 'Marcar como resolvido' }))

    expect(await screen.findByText('Alerta marcado como resolvido.')).toBeInTheDocument()
    expect(await screen.findByText('Nenhum alerta aberto.')).toBeInTheDocument()
    expect(callsTo('POST /api/admin/alerts/5/resolve')).toHaveLength(1)
  })

  it('edits the calculation parameters within their limits', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(admin),
      'GET /api/admin/settings': { body: { data: settings } },
      'PUT /api/admin/settings': {
        body: { data: [{ ...settings[0], value: 2.2 }, settings[1]], message: 'Parâmetros salvos.' },
      },
    })
    const { user } = renderRoute('/admin/parametros')

    const protein = await screen.findByLabelText('Perder gordura')
    expect(screen.getByText('Padrão: 2')).toBeInTheDocument()
    const save = screen.getByRole('button', { name: 'Salvar parâmetros' })
    expect(save).toBeDisabled()

    await user.clear(protein)
    await user.type(protein, '9')
    await user.click(save)
    expect(screen.getByText('Entre 0,5 e 4.')).toBeInTheDocument()
    expect(callsTo('PUT /api/admin/settings')).toHaveLength(0)

    await user.clear(protein)
    await user.type(protein, '2,2')
    await user.click(save)

    expect(await screen.findByText('Parâmetros salvos.')).toBeInTheDocument()
    expect(callsTo('PUT /api/admin/settings')[0].body).toEqual({
      values: [
        { key: 'protein.lose_fat', value: 2.2 },
        { key: 'activity.sedentary.low', value: 1.375 },
      ],
    })
  })
})

describe('Ver como usuário', () => {
  const viewed = makeUser({
    impersonation: { admin_name: 'Brenno Leite', expires_at: '2026-11-22T13:00:00Z' },
  })

  it('shows the fixed bar and leaves back to the admin', async () => {
    const go = vi.spyOn(pageLoad, 'go').mockImplementation(() => {})
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(viewed),
      'DELETE /api/admin/impersonation': { body: { message: 'ok' } },
    })
    const { user } = renderRoute('/hoje')

    const bar = await screen.findByRole('region', { name: 'Acesso de suporte' })
    expect(bar).toHaveTextContent('Você está vendo como Ana Souza')
    expect(bar).toHaveTextContent('Somente leitura.')

    await user.click(within(bar).getByRole('button', { name: 'Sair' }))
    await vi.waitFor(() => expect(go).toHaveBeenCalledWith('/admin/usuarios'))
    expect(callsTo('DELETE /api/admin/impersonation')).toHaveLength(1)
  })

  it('keeps the admin panel closed and hides its link meanwhile', async () => {
    mockApi({ 'GET /api/user': signedIn({ ...viewed, role: 'admin' }) })
    const { router } = renderRoute('/admin')

    await screen.findByRole('region', { name: 'Acesso de suporte' })
    expect(router.state.location.pathname).toBe('/hoje')
  })

  it('shows the read-only refusal when something is changed', async () => {
    mockApi({
      'GET /api/user': signedIn(viewed),
      'PATCH /api/profile/preferences': {
        status: 403,
        body: {
          message: 'Modo somente leitura: você está vendo a conta de outra pessoa e não pode alterar nada.',
        },
      },
    })
    const { user } = renderRoute('/perfil')

    await user.click(await screen.findByRole('radio', { name: 'Libras (lb)' }))

    expect(await screen.findByText(/Modo somente leitura/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Painel admin/ })).not.toBeInTheDocument()
  })
})
