import { screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../test/render'
import { Button } from './Button'
import { Modal } from './Modal'
import { Tabs } from './Tabs'
import { useToast } from './toastContext'

function ToastDemo() {
  const toast = useToast()
  return (
    <Button onClick={() => toast({ title: 'Série registrada', description: '60 kg × 10' })}>Mostrar</Button>
  )
}

function ModalDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Abrir</Button>
      <Modal open={open} onOpenChange={setOpen} title="Finalizar treino?" description="Confirme." />
    </>
  )
}

describe('Toast', () => {
  it('shows a message when triggered', async () => {
    const { user } = renderWithProviders(<ToastDemo />)
    await user.click(screen.getByRole('button', { name: 'Mostrar' }))
    expect(await screen.findByText('Série registrada')).toBeInTheDocument()
    expect(screen.getByText('60 kg × 10')).toBeInTheDocument()
  })
})

describe('Modal', () => {
  it('opens as an accessible dialog and closes with the close button', async () => {
    const { user } = renderWithProviders(<ModalDemo />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))

    const dialog = screen.getByRole('dialog', { name: 'Finalizar treino?' })
    expect(dialog).toHaveAccessibleDescription('Confirme.')

    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Tabs', () => {
  it('switches the visible panel', async () => {
    const { user } = renderWithProviders(
      <Tabs
        items={[
          { value: 'a', label: 'Meu plano', content: 'Conteúdo do plano' },
          { value: 'b', label: 'Histórico', content: 'Conteúdo do histórico' },
        ]}
      />,
    )
    expect(screen.getByText('Conteúdo do plano')).toBeVisible()

    await user.click(screen.getByRole('tab', { name: 'Histórico' }))
    expect(screen.getByRole('tab', { name: 'Histórico' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Conteúdo do histórico')).toBeVisible()
  })
})
