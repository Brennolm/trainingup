import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
}

// Bottom sheet on mobile, centered dialog on larger screens.
export function Modal({ open, onOpenChange, title, description, children, footer }: ModalProps) {
  const { t } = useTranslation()
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-overlay fixed inset-0 z-40 data-[state=open]:animate-[fade-in_150ms_ease-out]" />
        <Dialog.Content
          className="bg-surface ring-border fixed inset-x-0 bottom-0 z-50 grid max-h-[90dvh] gap-4 overflow-y-auto rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] ring-1 focus:outline-none data-[state=open]:animate-[sheet-in_200ms_ease-out] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:pb-5"
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="font-display text-2xl font-extrabold uppercase italic">
              {title}
            </Dialog.Title>
            <Dialog.Close
              className="text-muted hover:bg-surface-2 hover:text-text -mt-2 -mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-xl"
              aria-label={t('common.close')}
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          {description && <Dialog.Description className="text-muted">{description}</Dialog.Description>}
          {children}
          {footer && <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
