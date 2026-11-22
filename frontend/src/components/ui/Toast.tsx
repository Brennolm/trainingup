import * as RadixToast from '@radix-ui/react-toast'
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { ToastContext, type ToastInput } from './toastContext'

type ToastItem = ToastInput & { id: number }

const icons = { success: CheckCircle2, warning: AlertTriangle, error: XCircle }
const toneColor = { success: 'text-success', warning: 'text-warning', error: 'text-danger' }

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((input: ToastInput) => {
    setToasts((list) => [...list, { ...input, id: Date.now() + Math.random() }])
  }, [])

  return (
    <ToastContext.Provider value={show}>
      <RadixToast.Provider swipeDirection="down" duration={4000}>
        {children}
        {toasts.map(({ id, title, description, tone = 'success' }) => {
          const Icon = icons[tone]
          return (
            <RadixToast.Root
              key={id}
              onOpenChange={(open) => !open && setToasts((l) => l.filter((x) => x.id !== id))}
              className="bg-surface ring-border flex items-start gap-3 rounded-2xl p-4 shadow-lg ring-1 data-[state=open]:animate-[sheet-in_200ms_ease-out]"
            >
              <Icon className={cn('mt-0.5 size-5 shrink-0', toneColor[tone])} aria-hidden />
              <div className="grid min-w-0 flex-1 gap-0.5">
                <RadixToast.Title className="font-semibold">{title}</RadixToast.Title>
                {description && (
                  <RadixToast.Description className="text-muted text-sm">
                    {description}
                  </RadixToast.Description>
                )}
              </div>
              <RadixToast.Close
                className="text-muted hover:text-text -m-2 grid h-11 w-11 shrink-0 place-items-center rounded-lg"
                aria-label={t('common.close')}
              >
                <X className="size-4" aria-hidden />
              </RadixToast.Close>
            </RadixToast.Root>
          )
        })}
        <RadixToast.Viewport className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto grid w-full max-w-md gap-2 px-4 outline-none md:bottom-6" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}
