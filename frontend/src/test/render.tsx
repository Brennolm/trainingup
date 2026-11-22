import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { ToastProvider } from '../components/ui/Toast'
import { ThemeProvider } from '../theme/ThemeProvider'

type Options = RenderOptions & { route?: string }

// Renders a component with the same providers the app uses.
export function renderWithProviders(ui: ReactElement, { route = '/', ...options }: Options = {}) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
  return { user: userEvent.setup(), ...render(ui, { wrapper: Wrapper, ...options }) }
}
