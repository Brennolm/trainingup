import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('associates the label with the field', () => {
    render(<Input label="E-mail" />)
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
  })

  it('describes the field with the hint', () => {
    render(<Input label="Carga" hint="Pré-preenchido com a última sessão" />)
    expect(screen.getByLabelText('Carga')).toHaveAccessibleDescription('Pré-preenchido com a última sessão')
  })

  it('marks the field invalid and shows the error instead of the hint', () => {
    render(<Input label="E-mail" hint="Dica" error="Informe um e-mail válido." />)
    const input = screen.getByLabelText('E-mail')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Informe um e-mail válido.')
    expect(screen.queryByText('Dica')).not.toBeInTheDocument()
  })

  it('lets the user show and hide the password', async () => {
    render(<Input label="Senha" type="password" />)
    const input = screen.getByLabelText('Senha')
    expect(input).toHaveAttribute('type', 'password')

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(input).toHaveAttribute('type', 'text')

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('does not render the show-password button for other types', () => {
    render(<Input label="E-mail" type="email" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
