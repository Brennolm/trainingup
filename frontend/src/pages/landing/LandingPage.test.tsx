import { act, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/render'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('shows every section of SPEC 6.1 in order', () => {
    renderWithProviders(<LandingPage />)
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual([
      'Dois produtos em um',
      'Como funciona',
      'Recursos',
      'Instale como app',
      'Perguntas frequentes',
      'Comece hoje',
    ])
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Treino e dieta no mesmo plano')
  })

  it('shows the beta badge and sends every sign-up CTA to /criar-conta', () => {
    renderWithProviders(<LandingPage />)
    expect(screen.getByText('Gratuito durante o beta')).toBeInTheDocument()
    for (const name of ['Criar conta', 'Comece grátis', 'Criar conta grátis']) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', '/criar-conta')
    }
  })

  it('header has section anchors and the sign-in link', () => {
    renderWithProviders(<LandingPage />)
    const nav = screen.getAllByRole('navigation', { name: 'Seções da página' })[0]
    expect(within(nav).getByRole('link', { name: 'Como funciona' })).toHaveAttribute('href', '#como-funciona')
    expect(within(nav).getByRole('link', { name: 'Recursos' })).toHaveAttribute('href', '#recursos')
    expect(within(nav).getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '#faq')
    expect(screen.getAllByRole('link', { name: 'Entrar' })[0]).toHaveAttribute('href', '/entrar')
    expect(document.getElementById('como-funciona')).toBeInTheDocument()
    expect(document.getElementById('recursos')).toBeInTheDocument()
    expect(document.getElementById('faq')).toBeInTheDocument()
  })

  it('mobile menu opens and closes', async () => {
    const { user } = renderWithProviders(<LandingPage />)
    const toggle = screen.getByRole('button', { name: 'Abrir menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('navigation', { name: 'Seções da página' })).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Fechar menu' }))
    expect(screen.getAllByRole('navigation', { name: 'Seções da página' })).toHaveLength(1)
  })

  it('lists the six features and the three steps', () => {
    renderWithProviders(<LandingPage />)
    for (const title of [
      'Treino gerado',
      'Registro offline',
      'Evolução de carga',
      'Plano alimentar com trocas',
      'Lista de compras',
      'Peso e medidas',
    ]) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument()
    }
    expect(screen.getByLabelText('Passo 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Passo 3')).toBeInTheDocument()
  })

  it('FAQ answers the five questions and states it does not replace professionals', async () => {
    const { user } = renderWithProviders(<LandingPage />)
    for (const q of [
      'É grátis?',
      'Substitui nutricionista ou personal?',
      'Funciona sem internet?',
      'O que vocês fazem com meus dados?',
      'Posso montar meu próprio treino ou dieta?',
    ]) {
      expect(screen.getByText(q)).toBeInTheDocument()
    }
    const question = screen.getByText('Substitui nutricionista ou personal?')
    await user.click(question)
    expect(question.closest('details')).toHaveAttribute('open')
    expect(screen.getByText(/não substituem o acompanhamento/)).toBeVisible()
  })

  it('footer has legal links, contact e-mail and the professional-advice disclaimer', () => {
    renderWithProviders(<LandingPage />)
    const legal = screen.getByRole('navigation', { name: 'Links legais' })
    expect(within(legal).getByRole('link', { name: 'Termos de Uso' })).toHaveAttribute('href', '/termos')
    expect(within(legal).getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute(
      'href',
      '/privacidade',
    )
    expect(within(legal).getByRole('link', { name: 'Política de Cookies' })).toHaveAttribute(
      'href',
      '/cookies',
    )
    expect(screen.getByText('contato@trainingup.com.br')).toBeInTheDocument()
    expect(
      screen.getByText('Os planos são sugestões e estimativas e não substituem acompanhamento profissional.'),
    ).toBeInTheDocument()
  })

  it('offers a one-tap install button only when the browser supports it', async () => {
    const { user } = renderWithProviders(<LandingPage />)
    expect(screen.queryByRole('button', { name: 'Instalar agora' })).not.toBeInTheDocument()

    const prompt = vi.fn().mockResolvedValue(undefined)
    const event = Object.assign(new Event('beforeinstallprompt'), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    })
    act(() => {
      window.dispatchEvent(event)
    })

    await user.click(await screen.findByRole('button', { name: 'Instalar agora' }))
    expect(prompt).toHaveBeenCalledOnce()
    expect(await screen.findByText('App instalado.')).toBeInTheDocument()
  })

  it('sets the page title', () => {
    renderWithProviders(<LandingPage />)
    expect(document.title).toBe('Training Up · Treino e dieta no mesmo plano')
  })
})
