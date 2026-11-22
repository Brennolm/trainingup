import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
import { routes } from '../appRoutes'
import { ToastProvider } from '../components/ui/Toast'
import { ThemeProvider } from '../theme/ThemeProvider'

type Options = RenderOptions & { route?: string }

function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function Providers({ children, client }: { children: ReactNode; client: QueryClient }) {
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

// Renders a component with the same providers the app uses.
export function renderWithProviders(ui: ReactElement, { route = '/', ...options }: Options = {}) {
  const client = newQueryClient()
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Providers client={client}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </Providers>
  )
  return { user: userEvent.setup(), client, ...render(ui, { wrapper: Wrapper, ...options }) }
}

// Renders the real route tree at a given URL (guards, layouts, redirects).
export function renderRoute(path: string, state?: unknown) {
  const client = newQueryClient()
  const router = createMemoryRouter(routes, {
    initialEntries: [
      { pathname: path.split('?')[0], search: path.includes('?') ? `?${path.split('?')[1]}` : '', state },
    ],
  })
  const result = render(
    <Providers client={client}>
      <RouterProvider router={router} />
    </Providers>,
  )
  return { user: userEvent.setup(), router, client, ...result }
}
