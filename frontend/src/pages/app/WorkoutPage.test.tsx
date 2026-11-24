import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { makeExercise, sampleExercises } from '../../test/exerciseFixtures'
import { makeUser, mockApi, signedIn } from '../../test/mockApi'
import { renderRoute } from '../../test/render'

function setup() {
  mockApi({
    'GET /api/user': signedIn(makeUser()),
    'GET /api/exercises': { body: { data: sampleExercises } },
  })
  return renderRoute('/treino')
}

const names = (list: HTMLElement) =>
  within(list)
    .getAllByRole('button')
    .map((b) => b.querySelector('.font-semibold')?.textContent)

describe('Treino → Exercícios', () => {
  it('opens on the library while the plan is not ready', async () => {
    setup()

    expect(await screen.findByRole('heading', { name: 'Treino' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Exercícios' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Meu plano' })).toBeInTheDocument()
    expect(await screen.findByText('3 exercícios')).toBeInTheDocument()
  })

  it('searches ignoring accents and filters by muscle and equipment', async () => {
    const { user } = setup()
    const list = await screen.findByRole('list', { name: 'Exercícios' })

    await user.type(screen.getByLabelText('Buscar exercício'), 'flexao')
    expect(await screen.findByText('1 exercício')).toBeInTheDocument()
    expect(names(list)).toEqual(['Flexão de braços'])
    expect(within(list).getByText('Peito · Peso do corpo')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Buscar exercício'))
    await user.selectOptions(screen.getByLabelText('Grupo muscular'), 'Peito')
    expect(await screen.findByText('2 exercícios')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Equipamento'), 'Halteres')
    expect(await screen.findByText('1 exercício')).toBeInTheDocument()
    expect(names(screen.getByRole('list', { name: 'Exercícios' }))).toEqual(['Supino reto com halteres'])

    await user.selectOptions(screen.getByLabelText('Grupo muscular'), 'Quadríceps')
    expect(await screen.findByText('Nenhum exercício encontrado com esses filtros.')).toBeInTheDocument()
  })

  it('shows the details and the caution about injuries', async () => {
    const { user } = setup()

    const item = await screen.findByRole('button', { name: /Agachamento livre com barra/ })
    expect(item).toHaveAttribute('aria-expanded', 'false')
    await user.click(item)

    expect(item).toHaveAttribute('aria-expanded', 'true')
    const details = document.getElementById(item.getAttribute('aria-controls')!)!
    expect(details).toHaveTextContent('Nível:Intermediário')
    expect(details).toHaveTextContent('Padrão de movimento:Agachar')
    expect(details).toHaveTextContent('Grupos secundários:Glúteos')
    expect(details).toHaveTextContent(
      'Evite ou fale com um profissional se tiver dor ou lesão em: Joelho, Lombar.',
    )
  })

  it('shows the example image in the details, and nothing when there is none', async () => {
    mockApi({
      'GET /api/user': signedIn(makeUser()),
      'GET /api/exercises': {
        body: {
          data: [{ ...sampleExercises[0], image_url: 'https://api.example.com/a.jpg' }, sampleExercises[1]],
        },
      },
    })
    const { user } = renderRoute('/treino')

    await user.click(await screen.findByRole('button', { name: /Supino reto com halteres/ }))
    expect(screen.getByAltText('Imagem de exemplo: Supino reto com halteres')).toHaveAttribute(
      'src',
      'https://api.example.com/a.jpg',
    )

    await user.click(screen.getByRole('button', { name: /Agachamento livre com barra/ }))
    expect(screen.queryByAltText('Imagem de exemplo: Agachamento livre com barra')).not.toBeInTheDocument()
  })
})

describe('Treino → Exercícios pagination', () => {
  const many = Array.from({ length: 23 }, (_, i) =>
    makeExercise({
      id: i + 1,
      slug: `ex-${i + 1}`,
      name: `Exercício ${String(i + 1).padStart(2, '0')}`,
      primary_muscle: i < 3 ? 'abs' : 'chest',
    }),
  )
  const setupMany = () => {
    mockApi({ 'GET /api/user': signedIn(makeUser()), 'GET /api/exercises': { body: { data: many } } })
    return renderRoute('/treino')
  }
  const list = () => screen.getByRole('list', { name: 'Exercícios' })

  beforeEach(() => localStorage.clear())

  it('shows 4 per page and starts again from page 1 when a filter changes', async () => {
    const { user } = setupMany()

    await screen.findByRole('list', { name: 'Exercícios' })
    expect(screen.getByText('23 exercícios')).toBeInTheDocument()
    expect(names(list())).toEqual(['Exercício 01', 'Exercício 02', 'Exercício 03', 'Exercício 04'])
    expect(screen.getByText('Página 1 de 6')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(screen.getByText('Página 2 de 6')).toBeInTheDocument()
    expect(names(list())[0]).toBe('Exercício 05')

    await user.selectOptions(screen.getByLabelText('Grupo muscular'), 'Peito')
    expect(await screen.findByText('20 exercícios')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 5')).toBeInTheDocument()
    expect(names(list())[0]).toBe('Exercício 04')

    // Everything on one page: no pager.
    await user.selectOptions(screen.getByLabelText('Grupo muscular'), 'Abdômen')
    expect(await screen.findByText('3 exercícios')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Páginas' })).not.toBeInTheDocument()
  })

  it('lets the person show more per page and remembers the choice', async () => {
    const { user, unmount } = setupMany()

    await screen.findByRole('list', { name: 'Exercícios' })
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await user.selectOptions(screen.getByLabelText('Por página'), '10')
    expect(names(list())).toHaveLength(10)
    expect(names(list())[0]).toBe('Exercício 01')
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Por página'), '50')
    expect(names(list())).toHaveLength(23)
    expect(screen.queryByRole('navigation', { name: 'Páginas' })).not.toBeInTheDocument()

    unmount()
    setupMany()
    await screen.findByRole('list', { name: 'Exercícios' })
    expect(screen.getByLabelText('Por página')).toHaveValue('50')
    expect(names(list())).toHaveLength(23)
  })
})
