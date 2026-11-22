import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { DesignSystemPage } from './pages/DesignSystemPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

const router = createBrowserRouter([
  { path: '/', element: <PlaceholderPage /> },
  { path: '/design/*', element: <DesignSystemPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
