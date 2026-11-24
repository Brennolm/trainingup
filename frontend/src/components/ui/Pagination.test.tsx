import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('renders nothing when everything fits in one page', () => {
    const { container } = render(<Pagination page={1} last={1} onChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('moves between pages and disables the ends', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<Pagination page={1} last={3} onChange={onChange} />)

    expect(screen.getByRole('navigation', { name: 'Páginas' })).toHaveTextContent('Página 1 de 3')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(onChange).toHaveBeenCalledWith(2)

    rerender(<Pagination page={3} last={3} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(onChange).toHaveBeenLastCalledWith(2)
  })
})
