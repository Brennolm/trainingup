import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'info' | 'success' | 'warning' | 'error'

const tones: Record<Tone, { icon: typeof Info; className: string; iconClass: string }> = {
  info: { icon: Info, className: 'bg-surface-2', iconClass: 'text-muted' },
  success: { icon: CheckCircle2, className: 'bg-success/10 ring-success/30', iconClass: 'text-success' },
  warning: { icon: AlertTriangle, className: 'bg-warning/10 ring-warning/30', iconClass: 'text-warning' },
  error: { icon: XCircle, className: 'bg-danger/10 ring-danger/30', iconClass: 'text-danger' },
}

/** Inline message. Errors are announced immediately to screen readers. */
export function Alert({
  tone = 'info',
  children,
  className,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  const { icon: Icon, className: toneClass, iconClass } = tones[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'text-text flex gap-3 rounded-xl p-3 text-sm ring-1 ring-transparent ring-inset',
        toneClass,
        className,
      )}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', iconClass)} aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
