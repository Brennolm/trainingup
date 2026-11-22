import { lazy, Suspense } from 'react'

// Internal design-system showcase: loaded on demand so it never weighs on the landing page.
const DesignSystemPage = lazy(() =>
  import('./DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })),
)

export function DesignSystemRoute() {
  return (
    <Suspense fallback={null}>
      <DesignSystemPage />
    </Suspense>
  )
}
