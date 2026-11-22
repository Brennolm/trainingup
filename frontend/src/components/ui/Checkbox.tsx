import { Check } from 'lucide-react'
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode; error?: string }

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { label, error, id, className, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={cn('grid gap-1.5', className)}>
      <div className="flex min-h-11 items-start gap-3 py-1 text-sm">
        <span className="relative mt-0.5 grid size-6 shrink-0 place-items-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="peer border-border bg-surface-2 checked:bg-primary checked:border-primary aria-invalid:border-danger size-6 cursor-pointer appearance-none rounded-md border-2 transition-colors"
            {...props}
          />
          <Check
            className="text-on-primary pointer-events-none absolute size-4 opacity-0 peer-checked:opacity-100"
            strokeWidth={3}
            aria-hidden
          />
        </span>
        {/* Label is separate from the box so links inside it stay clickable. */}
        <label htmlFor={inputId} className="cursor-pointer pt-0.5">
          {label}
        </label>
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-danger text-sm">
          {error}
        </p>
      )}
    </div>
  )
})
