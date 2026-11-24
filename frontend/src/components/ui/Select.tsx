import { ChevronDown } from 'lucide-react'
import { useId, type SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: { value: string; label: string }[]
  error?: string
}

/** Native select (best on phones) with the look of Input. */
export function Select({ label, options, error, id, className, ...props }: Props) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={selectId} className="text-text text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={cn(
            'bg-surface-2 ring-border text-text focus:ring-primary h-12 w-full cursor-pointer appearance-none rounded-xl pr-10 pl-4 text-base ring-1 transition-shadow ring-inset focus:ring-2 focus:outline-none',
            error && 'ring-danger',
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="text-muted pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2"
          aria-hidden
        />
      </div>
      {error && (
        <p id={`${selectId}-error`} className="text-danger text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
