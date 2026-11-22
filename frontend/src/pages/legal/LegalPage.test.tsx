import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../../test/render'

describe('LegalPage', () => {
  it('shows the version, the sections and links to the other documents', () => {
    renderRoute('/termos')

    expect(screen.getByText('Versão 2026-11-22, em vigor desde 22/11/2026.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '4. Sua saúde vem primeiro' })).toBeInTheDocument()
    const other = screen.getByRole('navigation', { name: 'Outros documentos' })
    expect(within(other).getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute(
      'href',
      '/privacidade',
    )
    expect(within(other).queryByRole('link', { name: 'Termos de Uso' })).not.toBeInTheDocument()
  })

  it('fills in the controller and the contact e-mail', () => {
    renderRoute('/privacidade')

    const section = screen.getByRole('heading', { name: '1. Quem cuida dos seus dados' }).parentElement!
    expect(section).toHaveTextContent('Brenno Leite, pessoa física, de São Paulo/SP')
    expect(section).toHaveTextContent('contato@trainingup.com.br')
    expect(section).not.toHaveTextContent('{{')
  })

  it('states the read-only support access (SPEC 2.6)', () => {
    renderRoute('/privacidade')

    expect(screen.getByRole('heading', { name: '6. Acesso de suporte' })).toBeInTheDocument()
    expect(screen.getByText(/modo somente leitura/)).toBeInTheDocument()
  })

  it('lists only essential cookies', () => {
    renderRoute('/cookies')

    expect(screen.getByText(/training-up-session/)).toBeInTheDocument()
    expect(screen.getByText(/XSRF-TOKEN/)).toBeInTheDocument()
    expect(
      screen.getByText(/Não usamos cookies de publicidade, de análise nem de terceiros/),
    ).toBeInTheDocument()
  })
})
