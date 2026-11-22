import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'warning' | 'error'
export type ToastInput = { title: string; description?: string; tone?: ToastTone }

export const ToastContext = createContext<((t: ToastInput) => void) | null>(null)

export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used inside ToastProvider')
  return show
}
