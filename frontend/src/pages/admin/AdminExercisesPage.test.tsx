import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { shrinkImage } from '../../features/admin/shrinkImage'
import { makeExercise, sampleExercises } from '../../test/exerciseFixtures'
import { makeUser, mockApi, signedIn } from '../../test/mockApi'
import { renderRoute } from '../../test/render'

// Re-encoding needs a real image decoder and canvas (not in jsdom).
vi.mock('../../features/admin/shrinkImage', () => ({ shrinkImage: vi.fn() }))

const admin = makeUser({ id: 9, name: 'Brenno Leite', role: 'admin' })

describe('Admin → Exercícios', () => {
  it('lists the base with the inactive ones marked', async () => {
    mockApi({
      'GET /api/user': signedIn(admin),
      'GET /api/admin/exercises': {
        body: {
          data: [...sampleExercises, makeExercise({ id: 4, name: 'Remada antiga', is_active: false })],
        },
      },
    })
    const { user } = renderRoute('/admin')

    await user.click((await screen.findAllByRole('link', { name: 'Exercícios' }))[0])
    expect(await screen.findByText('4 exercícios (1 desativados)')).toBeInTheDocument()
    const old = screen.getByText('Remada antiga').closest('li')!
    expect(old).toHaveTextContent('Desativado')
    expect(screen.getByText('Supino reto com halteres').closest('li')).toHaveTextContent(
      'Peito · Empurrar na horizontal · Halteres, Banco · Iniciante',
    )

    await user.type(screen.getByLabelText('Buscar por nome'), 'agach')
    expect(await screen.findByText('1 exercício (0 desativados)')).toBeInTheDocument()
  })

  it('creates an exercise, checking the required fields first', async () => {
    let created = false
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(admin),
      'GET /api/admin/exercises': () => ({
        body: { data: created ? [makeExercise({ id: 7, name: 'Prancha', equipment: [] })] : [] },
      }),
      'POST /api/admin/exercises': () => {
        created = true
        return {
          status: 201,
          body: { data: makeExercise({ id: 7, name: 'Prancha' }), message: 'Exercício criado.' },
        }
      },
    })
    const { user } = renderRoute('/admin/exercicios')

    await user.click(await screen.findByRole('button', { name: 'Novo exercício' }))
    const dialog = await screen.findByRole('dialog', { name: 'Novo exercício' })
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))
    expect(within(dialog).getAllByText('Campo obrigatório.')).toHaveLength(3)
    expect(callsTo('POST /api/admin/exercises')).toHaveLength(0)

    await user.type(within(dialog).getByLabelText('Nome'), 'Prancha')
    await user.selectOptions(within(dialog).getByLabelText('Grupo muscular principal'), 'Abdômen')
    await user.selectOptions(within(dialog).getByLabelText('Padrão de movimento'), 'Core')
    // The primary muscle is not offered again as a secondary one.
    const secondary = within(dialog).getByRole('group', { name: 'Grupos secundários' })
    expect(within(secondary).queryByRole('checkbox', { name: 'Abdômen' })).not.toBeInTheDocument()
    await user.click(within(secondary).getByRole('checkbox', { name: 'Ombros' }))
    await user.click(within(dialog).getByRole('radio', { name: 'Intermediário' }))
    await user.click(
      within(within(dialog).getByRole('group', { name: 'Contraindicações' })).getByRole('checkbox', {
        name: 'Ombro',
      }),
    )
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Exercício criado.')).toBeInTheDocument()
    expect(callsTo('POST /api/admin/exercises')[0].body).toEqual({
      name: 'Prancha',
      primary_muscle: 'abs',
      secondary_muscles: ['shoulders'],
      movement_pattern: 'core',
      equipment: [],
      level: 'intermediate',
      contraindications: ['shoulder'],
      is_active: true,
    })
    // It stays open as an edit, so the image can be sent right away.
    const edit = await screen.findByRole('dialog', { name: 'Editar exercício' })
    expect(within(edit).getByRole('button', { name: 'Enviar imagem' })).toBeInTheDocument()
    expect(await screen.findByText('Prancha')).toBeInTheDocument()
  })

  it('edits and deactivates an exercise, showing API validation on the field', async () => {
    const exercise = makeExercise()
    let attempt = 0
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(admin),
      'GET /api/admin/exercises': { body: { data: [exercise] } },
      'PUT /api/admin/exercises/1': () => {
        attempt++
        return attempt === 1
          ? {
              status: 422,
              body: {
                message: 'Já existe um exercício com este nome.',
                errors: { name: ['Já existe um exercício com este nome.'] },
              },
            }
          : { body: { data: { ...exercise, is_active: false }, message: 'Exercício salvo.' } }
      },
    })
    const { user } = renderRoute('/admin/exercicios')

    await user.click(await screen.findByRole('button', { name: 'Editar Supino reto com halteres' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar exercício' })
    expect(within(dialog).getByLabelText('Nome')).toHaveValue('Supino reto com halteres')
    expect(within(dialog).getByRole('checkbox', { name: 'Halteres' })).toBeChecked()

    await user.click(within(dialog).getByRole('checkbox', { name: /Ativo/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))
    expect(await within(dialog).findByText('Já existe um exercício com este nome.')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Exercício salvo.')).toBeInTheDocument()
    expect(callsTo('PUT /api/admin/exercises/1')[1].body).toMatchObject({
      is_active: false,
      name: exercise.name,
    })
    expect(callsTo('PUT /api/admin/exercises/1')[1].body).not.toHaveProperty('slug')
  })

  it('shrinks the image, sends it right away and removes it', async () => {
    const small = new File(['jpg'], 'supino-reto-halteres.jpg', { type: 'image/jpeg' })
    const shrink = vi.mocked(shrinkImage).mockResolvedValue(small)
    const exercise = makeExercise()
    const withImage = { ...exercise, image_url: 'http://localhost:8010/api/exercise-media/supino-a.jpg' }
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(admin),
      'GET /api/admin/exercises': { body: { data: [exercise] } },
      'POST /api/admin/exercises/1/image': { body: { data: withImage, message: 'Imagem enviada.' } },
      'DELETE /api/admin/exercises/1/image': { body: { data: exercise, message: 'Imagem removida.' } },
    })
    const { user } = renderRoute('/admin/exercicios')

    await user.click(await screen.findByRole('button', { name: 'Editar Supino reto com halteres' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar exercício' })
    expect(within(dialog).getByText('Sem imagem')).toBeInTheDocument()

    // Checked in the app before uploading.
    const picker = within(dialog).getByLabelText('Escolher imagem')
    fireEvent.change(picker, { target: { files: [new File(['x'], 'anim.gif', { type: 'image/gif' })] } })
    expect(within(dialog).getByText('Envie uma imagem JPG, PNG ou WebP.')).toBeInTheDocument()
    expect(callsTo('POST /api/admin/exercises/1/image')).toHaveLength(0)

    const original = new File(['png'], 'gerada.png', { type: 'image/png' })
    fireEvent.change(picker, { target: { files: [original] } })
    expect(await screen.findByText('Imagem enviada.')).toBeInTheDocument()
    expect(shrink).toHaveBeenCalledWith(original, 'supino-reto-halteres')
    expect(callsTo('POST /api/admin/exercises/1/image')[0].body).toEqual({ file: small })
    expect(within(dialog).getByAltText('Imagem de Supino reto com halteres')).toHaveAttribute(
      'src',
      withImage.image_url,
    )
    expect(within(dialog).getByRole('button', { name: 'Trocar imagem' })).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Remover imagem' }))
    expect(await screen.findByText('Imagem removida.')).toBeInTheDocument()
    expect(within(dialog).getByText('Sem imagem')).toBeInTheDocument()
  })

  it('tells when the browser cannot read the image and sends nothing', async () => {
    vi.mocked(shrinkImage).mockResolvedValue(null)
    const { callsTo } = mockApi({
      'GET /api/user': signedIn(admin),
      'GET /api/admin/exercises': { body: { data: [makeExercise()] } },
    })
    const { user } = renderRoute('/admin/exercicios')

    await user.click(await screen.findByRole('button', { name: 'Editar Supino reto com halteres' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar exercício' })
    fireEvent.change(within(dialog).getByLabelText('Escolher imagem'), {
      target: { files: [new File(['?'], 'quebrada.jpg', { type: 'image/jpeg' })] },
    })

    expect(
      await within(dialog).findByText('Não foi possível ler esta imagem. Tente outro arquivo.'),
    ).toBeInTheDocument()
    expect(callsTo('POST /api/admin/exercises/1/image')).toHaveLength(0)
  })
})
