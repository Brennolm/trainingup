import { useId } from 'react'
import { cn } from '../../lib/cn'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  disabled?: boolean
}

/** Radio group styled as a segmented control (theme, units). */
export function SegmentedControl<T extends string>({ label, value, options, onChange, disabled }: Props<T>) {
  const name = useId()
  return (
    <fieldset className="grid gap-2" disabled={disabled}>
      <legend className="text-text mb-2 text-sm font-medium">{label}</legend>
      <div className="bg-surface-2 grid auto-cols-fr grid-flow-col gap-1 rounded-xl p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-3 text-center text-sm font-semibold transition-colors',
              'has-[:focus-visible]:outline-primary has-[:focus-visible]:outline-2',
              value === option.value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
