import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Questionnaire } from '../../features/questionnaire/types'
import { makeUser, mockApi, signedIn } from '../../test/mockApi'
import { blockedHealth, emptyQuestionnaire, filledQuestionnaire } from '../../test/questionnaireFixtures'
import { renderRoute } from '../../test/render'

const completed = filledQuestionnaire({ completed_at: '2026-11-22T13:00:00Z' })
const state = (data: Questionnaire | null = completed, consent = true) => ({
  body: { data, health_consent: consent },
})

describe('Perfil → Meus dados', () => {
  it('is reachable from the profile and lists every section with its answers', async () => {
    mockApi({ 'GET /api/user': signedIn(makeUser()), 'GET /api/questionnaire': state() })
    const { user, router } = renderRoute('/perfil')

    await user.click(await screen.findByRole('link', { name: /Meus dados/ }))

    expect(router.state.location.pathname).toBe('/perfil/meus-dados')
    const goal = await screen.findByRole('link', { name: 'Alterar Objetivo' })
    expect(goal).toHaveTextContent('Perder gordura')
    expect(goal).toHaveTextContent('Moderado')
    expect(screen.getByRole('link', { name: 'Alterar Sobre você' })).toHaveTextContent('62,5 kg')
    expect(screen.getByRole('link', { name: 'Alterar Saúde' })).toHaveTextContent('Todas "não"')
    expect(screen.getByRole('link', { name: 'Refazer questionário' })).toHaveAttribute(
      'href',
      '/questionario',
    )
  })

  it('edits one section and comes back with a confirmation', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser()),
      'GET /api/questionnaire': state(),
      'PUT /api/questionnaire/sections/goal': {
        body: { data: { ...completed, goal: { goal: 'maintain', goal_pace: null } } },
      },
    })
    const { user, router } = renderRoute('/perfil/meus-dados')

    await user.click(await screen.findByRole('link', { name: 'Alterar Objetivo' }))
    expect(router.state.location.pathname).toBe('/perfil/meus-dados/objetivo')
    const goals = await screen.findByRole('group', { name: 'Qual é o seu objetivo?' })
    expect(within(goals).getByRole('radio', { name: 'Perder gordura' })).toBeChecked()

    await user.click(within(goals).getByRole('radio', { name: 'Manter o peso' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Alteração salva.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/perfil/meus-dados')
    expect(callsTo('PUT /api/questionnaire/sections/goal')[0].body).toEqual({
      goal: 'maintain',
      goal_pace: null,
      confirm_correct: false,
    })
    expect(await screen.findByRole('link', { name: 'Alterar Objetivo' })).toHaveTextContent('Manter o peso')
  })

  it('rectifies health answers only with the explicit confirmation', async () => {
    const blocked = { ...completed, health: blockedHealth, blocked: true }
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser()),
      'GET /api/questionnaire': state(blocked),
      'PUT /api/questionnaire/sections/health': {
        body: {
          data: {
            ...completed,
            health: { ...completed.health, rectified_at: '2026-11-22T14:00:00Z' },
          },
        },
      },
    })
    const { user } = renderRoute('/perfil/meus-dados')

    expect(
      await screen.findByRole('heading', { name: /não vamos gerar planos automáticos/ }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Alterar Saúde' }))

    const conditions = await screen.findByRole('group', { name: /condições diagnosticadas/ })
    await user.click(within(conditions).getByRole('checkbox', { name: 'Nenhuma destas' }))
    expect(within(conditions).getByRole('checkbox', { name: 'Hipertensão (pressão alta)' })).not.toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(callsTo('PUT /api/questionnaire/sections/health')).toHaveLength(0)

    await user.click(screen.getByRole('checkbox', { name: 'Confirmo que as informações estão corretas' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Alteração salva.')).toBeInTheDocument()
    expect(callsTo('PUT /api/questionnaire/sections/health')[0].body).toMatchObject({
      conditions: [],
      confirm_correct: true,
    })
    expect(await screen.findByText(/Última alteração das respostas de saúde em/)).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /não vamos gerar planos automáticos/ }),
    ).not.toBeInTheDocument()
  })

  it('shows the server asking for confirmation (e.g. sex change that drops a pregnancy answer)', async () => {
    mockApi({
      'GET /api/user': signedIn(makeUser()),
      'GET /api/questionnaire': state(),
      'PUT /api/questionnaire/sections/personal': (body) =>
        body?.confirm_correct
          ? { body: { data: completed } }
          : {
              status: 422,
              body: {
                message: 'x',
                errors: {
                  confirm_correct: [
                    'Marque "Confirmo que as informações estão corretas" para salvar a alteração.',
                  ],
                },
              },
            },
    })
    const { user } = renderRoute('/perfil/meus-dados/sobre-voce')

    const sex = await screen.findByRole('group', { name: 'Sexo biológico' })
    await user.click(within(sex).getByRole('radio', { name: 'Masculino' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    const confirm = await screen.findByRole('checkbox', {
      name: 'Confirmo que as informações estão corretas',
    })
    await user.click(confirm)
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Alteração salva.')).toBeInTheDocument()
  })

  it('sends to the questionnaire when it is not finished yet', async () => {
    mockApi({ 'GET /api/user': signedIn(makeUser()), 'GET /api/questionnaire': state(emptyQuestionnaire()) })
    renderRoute('/perfil/meus-dados')

    expect(await screen.findByText(/ainda não terminou/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continuar questionário' })).toHaveAttribute(
      'href',
      '/questionario',
    )
  })

  it('asks the health data consent again before editing', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser()),
      'GET /api/questionnaire': state(completed, false),
      'POST /api/questionnaire/consent': { body: { health_consent: true } },
    })
    const { user } = renderRoute('/perfil/meus-dados')

    await user.click(await screen.findByRole('checkbox', { name: /Autorizo o Training Up/ }))
    await user.click(screen.getByRole('button', { name: 'Aceitar e continuar' }))

    expect(await screen.findByRole('link', { name: 'Alterar Objetivo' })).toBeInTheDocument()
    expect(callsTo('POST /api/questionnaire/consent')).toHaveLength(1)
  })
})

describe('Hoje', () => {
  it('invites to start the questionnaire', async () => {
    mockApi({ 'GET /api/user': signedIn(makeUser()), 'GET /api/questionnaire': state(null, false) })
    renderRoute('/hoje')

    expect(await screen.findByRole('heading', { name: 'Responda o questionário' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Começar' })).toHaveAttribute('href', '/questionario')
  })

  it('shows how much of a draft is done', async () => {
    mockApi({
      'GET /api/user': signedIn(makeUser()),
      'GET /api/questionnaire': state(filledQuestionnaire({ filled_sections: ['personal', 'health'] })),
    })
    renderRoute('/hoje')

    expect(await screen.findByText('Você já respondeu 2 de 6 partes do questionário.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continuar questionário' })).toBeInTheDocument()
  })

  it('says the plans are coming, or shows the block message', async () => {
    mockApi({ 'GET /api/user': signedIn(makeUser()), 'GET /api/questionnaire': state() })
    const { unmount } = renderRoute('/hoje')
    expect(await screen.findByRole('heading', { name: 'Respostas salvas' })).toBeInTheDocument()
    unmount()

    mockApi({
      'GET /api/user': signedIn(makeUser()),
      'GET /api/questionnaire': state({ ...completed, health: blockedHealth, blocked: true }),
    })
    renderRoute('/hoje')
    expect(
      await screen.findByRole('heading', { name: /não vamos gerar planos automáticos/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Corrigir minhas respostas' })).toHaveAttribute(
      'href',
      '/perfil/meus-dados',
    )
  })
})
