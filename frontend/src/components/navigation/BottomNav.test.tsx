import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../test/render'
import { BottomNav } from './BottomNav'
import { NAV_ITEMS } from './navItems'
import { Sidebar } from './Sidebar'

describe('Navigation', () => {
  it('shows the five app sections in order', () => {
    renderWithProviders(<BottomNav items={NAV_ITEMS} />)
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    const labels = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent)
    expect(labels).toEqual(['Hoje', 'Treino', 'Dieta', 'Progresso', 'Perfil'])
  })

  it('marks the current section as active', () => {
    renderWithProviders(<BottomNav items={NAV_ITEMS} />, { route: '/treino' })
    expect(screen.getByRole('link', { name: 'Treino' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Hoje' })).not.toHaveAttribute('aria-current')
  })

  it('sidebar uses the same items as the bottom nav', () => {
    renderWithProviders(<Sidebar items={NAV_ITEMS} />, { route: '/dieta' })
    expect(screen.getAllByRole('link')).toHaveLength(NAV_ITEMS.length)
    expect(screen.getByRole('link', { name: 'Dieta' })).toHaveAttribute('aria-current', 'page')
  })
})
