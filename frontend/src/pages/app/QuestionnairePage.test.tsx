import { screen, within } from '@testing-library/react'
import type userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Section } from '../../features/questionnaire/options'
import type { Questionnaire } from '../../features/questionnaire/types'
import { makeUser, mockApi, signedIn } from '../../test/mockApi'
import { blockedHealth, emptyQuestionnaire, filledQuestionnaire } from '../../test/questionnaireFixtures'
import { renderRoute } from '../../test/render'

type User = ReturnType<typeof userEvent.setup>

const group = (name: string | RegExp) => screen.getByRole('group', { name })
const pick = (user: User, groupName: string | RegExp, option: string | RegExp) =>
  user.click(within(group(groupName)).getByRole('radio', { name: option }))
const tick = (user: User, groupName: string | RegExp, option: string | RegExp) =>
  user.click(within(group(groupName)).getByRole('checkbox', { name: option }))
const next = (user: User) => user.click(screen.getByRole('button', { name: 'Continuar' }))

/** Fake API that keeps the questionnaire in memory, like the backend would. */
function questionnaireApi(initial: Questionnaire | null, consent = true) {
  let current = initial
  return {
    get state() {
      return current
    },
    handlers: {
      'GET /api/questionnaire': () => ({ body: { data: current, health_consent: consent } }),
      'POST /api/questionnaire/consent': () => {
        consent = true
        return { body: { health_consent: true } }
      },
      'POST /api/questionnaire': () => {
        current ??= emptyQuestionnaire()
        return { status: 201, body: { data: current } }
      },
      ...Object.fromEntries(
        (['personal', 'health', 'routine', 'goal', 'training', 'diet'] as Section[]).map((section) => [
          `PUT /api/questionnaire/sections/${section}`,
          (body: Record<string, unknown> | undefined) => {
            const base = current ?? emptyQuestionnaire()
            const filled = Array.from(new Set([...base.filled_sections, section]))
            const { confirm_correct: _confirm, ...answers } = body ?? {}
            const health =
              section === 'health'
                ? ({ ...answers, result: 'clear', rectified_at: null } as Questionnaire['health'])
                : base.health
            current = {
              ...base,
              ...(section === 'health' ? { health } : { [section]: { ...base[section], ...answers } }),
              filled_sections: filled,
            }
            return { body: { data: current } }
          },
        ]),
      ),
      'POST /api/questionnaire/complete': () => {
        current = { ...(current as Questionnaire), completed_at: '2026-11-22T13:00:00Z' }
        return { body: { data: current } }
      },
    },
  }
}

describe('Questionário', () => {
  it('asks the health data consent before the first question', async () => {
    const fake = questionnaireApi(null, false)
    const { callsTo } = mockApi({ 'GET /api/user': signedIn(makeUser()), ...fake.handlers })
    const { user } = renderRoute('/questionario')

    await user.click(await screen.findByRole('button', { name: 'Começar' }))
    expect(
      screen.getByText('Para continuar, marque a autorização de uso dos dados de saúde.'),
    ).toBeInTheDocument()
    expect(callsTo('POST /api/questionnaire')).toHaveLength(0)

    await user.click(screen.getByRole('checkbox', { name: /Autorizo o Training Up/ }))
    await user.click(screen.getByRole('button', { name: 'Começar' }))

    expect(await screen.findByRole('heading', { name: 'Sobre você' })).toBeInTheDocument()
    expect(screen.getByText('Passo 1 de 7')).toBeInTheDocument()
    expect(callsTo('POST /api/questionnaire/consent')[0].body).toEqual({ accept: true })
    expect(callsTo('POST /api/questionnaire')).toHaveLength(1)
  })

  it('goes through every step, shows the summary and generates the plans', async () => {
    const fake = questionnaireApi(emptyQuestionnaire())
    const { callsTo } = mockApi({ 'GET /api/user': signedIn(makeUser()), ...fake.handlers })
    const { user } = renderRoute('/questionario')

    // 1 · Sobre você (validation first)
    await screen.findByRole('heading', { name: 'Sobre você' })
    await next(user)
    expect(screen.getByText('Responda todas as perguntas para continuar.')).toBeInTheDocument()
    expect(screen.getByText('Informe um valor entre 120 e 230 cm.')).toBeInTheDocument()
    await pick(user, 'Sexo biológico', 'Masculino')
    await user.type(screen.getByLabelText('Altura'), '178')
    await user.type(screen.getByLabelText('Peso atual'), '80,5')
    await next(user)
    expect(callsTo('PUT /api/questionnaire/sections/personal')[0].body).toEqual({
      sex: 'male',
      height_cm: 178,
      weight_kg: 80.5,
      confirm_correct: false,
    })

    // 2 · Saúde: no pregnancy question for men
    await screen.findByRole('heading', { name: 'Saúde' })
    expect(screen.queryByRole('group', { name: /gestante/ })).not.toBeInTheDocument()
    const questions = screen.getAllByRole('group').filter((g) => /^\d\. /.test(g.textContent ?? ''))
    expect(questions).toHaveLength(7)
    for (const q of questions) await user.click(within(q).getByRole('radio', { name: 'Não' }))
    await tick(user, /condições diagnosticadas/, 'Nenhuma destas')
    await next(user)
    expect(callsTo('PUT /api/questionnaire/sections/health')[0].body).toEqual({
      par_q: [false, false, false, false, false, false, false],
      pregnant_or_lactating: null,
      conditions: [],
      confirm_correct: false,
    })

    // 3 · Rotina
    await screen.findByRole('heading', { name: 'Rotina' })
    await pick(user, /trabalho/, /Em pé/)
    await next(user)

    // 4 · Objetivo: pace only when not maintaining
    await screen.findByRole('heading', { name: 'Objetivo' })
    await pick(user, 'Qual é o seu objetivo?', 'Manter o peso')
    expect(screen.queryByRole('group', { name: 'Em que ritmo?' })).not.toBeInTheDocument()
    await pick(user, 'Qual é o seu objetivo?', 'Ganhar massa')
    await pick(user, 'Em que ritmo?', /Leve/)
    await next(user)
    expect(callsTo('PUT /api/questionnaire/sections/goal')[0].body).toMatchObject({
      goal: 'gain_muscle',
      goal_pace: 'light',
    })

    // 5 · Treino: 2 to 6 days, equipment "em breve"
    await screen.findByRole('heading', { name: 'Treino' })
    expect(screen.getByText('Equipamentos e lesões')).toBeInTheDocument()
    await pick(user, /experiência/, /Intermediário/)
    await tick(user, /dias você pode treinar/, 'Sexta')
    await pick(user, /tempo por treino/, '45 min')
    await pick(user, /Onde você vai treinar/, /Em casa/)
    await pick(user, 'Quer incluir cardio?', 'Não')
    await next(user)
    expect(screen.getByText('Escolha de 2 a 6 dias.')).toBeInTheDocument()
    await tick(user, /dias você pode treinar/, 'Segunda')
    await next(user)
    expect(callsTo('PUT /api/questionnaire/sections/training')[0].body).toEqual({
      experience: 'intermediate',
      training_days: ['mon', 'fri'],
      session_minutes: 45,
      training_location: 'home',
      wants_cardio: false,
      cardio_preference: null,
      confirm_correct: false,
    })

    // 6 · Alimentação: foods "em breve"
    await screen.findByRole('heading', { name: 'Alimentação' })
    expect(screen.getByText('Alimentos que você não come')).toBeInTheDocument()
    await tick(user, /restrições/, 'Vegano')
    await pick(user, /refeições por dia/, '4')
    await pick(user, /Como prefere o plano/, /Treino e descanso/)
    await next(user)

    // 7 · Resumo
    await screen.findByRole('heading', { name: 'Resumo' })
    expect(screen.getByText('Passo 7 de 7')).toBeInTheDocument()
    expect(screen.getByText('178 cm')).toBeInTheDocument()
    expect(screen.getByText('80,5 kg')).toBeInTheDocument()
    expect(screen.getByText('2× · Segunda, Sexta')).toBeInTheDocument()
    expect(screen.getByText('Vegano')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Gerar meus planos' }))
    expect(
      screen.getByText('Para gerar os planos, confirme que entendeu que eles são sugestões e estimativas.'),
    ).toBeInTheDocument()
    expect(callsTo('POST /api/questionnaire/complete')).toHaveLength(0)

    await user.click(screen.getByRole('checkbox', { name: /sugestões e estimativas/ }))
    await user.click(screen.getByRole('button', { name: 'Gerar meus planos' }))

    expect(await screen.findByRole('heading', { name: 'Tudo certo!' })).toBeInTheDocument()
    expect(callsTo('POST /api/questionnaire/complete')[0].body).toEqual({ accept_disclaimer: true })
  })

  it('resumes a draft at the first missing step and can go back', async () => {
    const draft = filledQuestionnaire({
      filled_sections: ['personal', 'health'],
      routine: { work_activity: null },
    })
    mockApi({ 'GET /api/user': signedIn(makeUser()), ...questionnaireApi(draft).handlers })
    const { user } = renderRoute('/questionario')

    expect(await screen.findByRole('heading', { name: 'Rotina' })).toBeInTheDocument()
    expect(screen.getByText('Passo 3 de 7')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(await screen.findByRole('heading', { name: 'Saúde' })).toBeInTheDocument()
  })

  it('converts the weight typed in pounds and saves the unit preference', async () => {
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser()),
      'PATCH /api/profile/preferences': {
        body: {
          data: makeUser({
            preferences: { theme: 'dark', weight_unit: 'lb', length_unit: 'cm', locale: 'pt_BR' },
          }),
        },
      },
      ...questionnaireApi(emptyQuestionnaire()).handlers,
    })
    const { user } = renderRoute('/questionario')

    await screen.findByRole('heading', { name: 'Sobre você' })
    await pick(user, 'Sexo biológico', 'Feminino')
    await user.click(within(group('Unidade de peso')).getByRole('radio', { name: /lb/ }))
    await user.type(screen.getByLabelText('Altura'), '165')
    await user.type(screen.getByLabelText('Peso atual'), '150')
    await next(user)

    expect(callsTo('PATCH /api/profile/preferences')[0].body).toEqual({ weight_unit: 'lb' })
    const body = callsTo('PUT /api/questionnaire/sections/personal')[0].body
    expect(body?.weight_kg).toBeCloseTo(68.04, 2)
  })

  it('asks pregnancy only to women and the confirmation when saved health answers change', async () => {
    const draft = filledQuestionnaire({ filled_sections: ['personal', 'health'] })
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser()),
      ...questionnaireApi(draft).handlers,
    })
    const { user } = renderRoute('/questionario')

    await screen.findByRole('heading', { name: 'Rotina' })
    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    await screen.findByRole('heading', { name: 'Saúde' })
    expect(group('Você está gestante ou amamentando?')).toBeInTheDocument()

    await pick(user, 'Você está gestante ou amamentando?', 'Sim')
    const confirm = screen.getByRole('checkbox', { name: 'Confirmo que as informações estão corretas' })
    await next(user)
    expect(
      screen.getByText('Marque "Confirmo que as informações estão corretas" para salvar a alteração.'),
    ).toBeInTheDocument()
    expect(callsTo('PUT /api/questionnaire/sections/health')).toHaveLength(0)

    await user.click(confirm)
    await next(user)
    expect(callsTo('PUT /api/questionnaire/sections/health')[0].body).toMatchObject({
      pregnant_or_lactating: true,
      confirm_correct: true,
    })
  })

  it('shows the block message instead of generating plans', async () => {
    const draft = filledQuestionnaire({ health: blockedHealth, blocked: true })
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser()),
      ...questionnaireApi(draft).handlers,
    })
    const { user } = renderRoute('/questionario')

    await screen.findByRole('heading', { name: 'Resumo' })
    expect(screen.getByRole('heading', { name: /não vamos gerar planos automáticos/ })).toBeInTheDocument()
    expect(screen.getByText('Hipertensão (pressão alta)')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Gerar meus planos' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Concluir questionário' }))

    expect(await screen.findByRole('heading', { name: 'Respostas salvas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ficha de treino' })).toHaveAttribute('href', '/treino')
    expect(callsTo('POST /api/questionnaire/complete')[0].body).toEqual({ accept_disclaimer: false })
  })

  it('offers a new version when the questionnaire was already completed', async () => {
    const done = filledQuestionnaire({ completed_at: '2026-11-22T13:00:00Z' })
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(makeUser()),
      ...questionnaireApi(done).handlers,
      'POST /api/questionnaire': {
        status: 201,
        body: { data: { ...done, version: 2, completed_at: null } },
      },
    })
    const { user } = renderRoute('/questionario')

    expect(await screen.findByRole('heading', { name: 'Refazer questionário' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument() // consent already given
    await user.click(screen.getByRole('button', { name: 'Refazer questionário completo' }))

    expect(await screen.findByRole('heading', { name: 'Resumo' })).toBeInTheDocument()
    expect(callsTo('POST /api/questionnaire')).toHaveLength(1)
  })
})
