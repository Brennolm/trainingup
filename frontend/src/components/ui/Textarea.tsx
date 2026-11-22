import { useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string }

/** Multi-line text field, same look as Input. */
export function Textarea({ label, hint, error, id, className, ...props }: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={inputId} className="text-text text-sm font-medium">
        {label}
      </label>
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'bg-surface-2 ring-border text-text placeholder:text-muted focus:ring-primary min-h-24 rounded-xl px-4 py-3 text-base ring-1 ring-inset focus:ring-2 focus:outline-none',
          error && 'ring-danger focus:ring-danger',
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-danger text-sm">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-muted text-sm">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
