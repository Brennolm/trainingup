import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
  suffix?: ReactNode
}

export function Input({ label, hint, error, suffix, id, type = 'text', className, ...props }: InputProps) {
  const { t } = useTranslation()
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={inputId} className="text-text text-sm font-medium">
        {label}
      </label>
      <div
        className={cn(
          'bg-surface-2 ring-border focus-within:ring-primary flex h-12 items-center rounded-xl ring-1 transition-shadow ring-inset focus-within:ring-2',
          error && 'ring-danger focus-within:ring-danger',
        )}
      >
        <input
          id={inputId}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="text-text placeholder:text-muted h-full min-w-0 flex-1 bg-transparent px-4 text-base focus:outline-none"
          {...props}
        />
        {suffix && <span className="text-muted pr-4 text-sm">{suffix}</span>}
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="text-muted hover:text-text grid h-11 w-11 place-items-center rounded-lg"
            aria-label={revealed ? t('common.hidePassword') : t('common.showPassword')}
          >
            {revealed ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        )}
      </div>
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
