import { Check } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Option<T> = { value: T; label: string; description?: string }

type Common<T> = {
  label: ReactNode
  hint?: ReactNode
  options: Option<T>[]
  error?: string
  /** "row": short answers side by side (Sim/Não); "stack": one card per line. */
  layout?: 'row' | 'stack' | 'grid'
}

const layouts = {
  row: 'grid auto-cols-fr grid-flow-col gap-2',
  stack: 'grid gap-2',
  grid: 'grid grid-cols-2 gap-2 sm:grid-cols-3',
}

const cardClass = (selected: boolean) =>
  cn(
    'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm ring-1 transition-colors ring-inset',
    'has-[:focus-visible]:outline-primary has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
    selected
      ? 'bg-primary/10 ring-primary text-text ring-2'
      : 'bg-surface-2 ring-border text-text hover:ring-muted',
  )

function Frame({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string
  children: ReactNode
}) {
  return (
    <fieldset
      className="grid gap-2"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <legend className="text-text mb-1 text-base font-semibold">{label}</legend>
      {hint && <p className="text-muted -mt-1 text-sm">{hint}</p>}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-danger text-sm">
          {error}
        </p>
      )}
    </fieldset>
  )
}

/** Single choice as tappable cards (radio group). `value` null = not answered yet. */
export function ChoiceGroup<T extends string | number | boolean>({
  label,
  hint,
  options,
  value,
  onChange,
  error,
  layout = 'stack',
}: Common<T> & { value: T | null; onChange: (value: T) => void }) {
  const name = useId()
  return (
    <Frame id={name} label={label} hint={hint} error={error}>
      <div className={layouts[layout]}>
        {options.map((option) => {
          const selected = value === option.value
          return (
            <label key={String(option.value)} className={cardClass(selected)}>
              <input
                type="radio"
                name={name}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="grid flex-1 gap-0.5">
                <span className="font-semibold">{option.label}</span>
                {option.description && <span className="text-muted">{option.description}</span>}
              </span>
            </label>
          )
        })}
      </div>
    </Frame>
  )
}

/** Multiple choice as chips (checkboxes). */
export function MultiChoice<T extends string>({
  label,
  hint,
  options,
  values,
  onChange,
  error,
  layout = 'grid',
}: Common<T> & { values: T[]; onChange: (values: T[]) => void }) {
  const name = useId()
  const toggle = (v: T) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v])
  return (
    <Frame id={name} label={label} hint={hint} error={error}>
      <div className={layouts[layout]}>
        {options.map((option) => {
          const selected = values.includes(option.value)
          return (
            <label key={option.value} className={cardClass(selected)}>
              <input
                type="checkbox"
                name={name}
                checked={selected}
                onChange={() => toggle(option.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-md border-2',
                  selected ? 'bg-primary border-primary' : 'border-border',
                )}
                aria-hidden
              >
                {selected && <Check className="text-on-primary size-3.5" strokeWidth={3} />}
              </span>
              <span className="font-semibold">{option.label}</span>
            </label>
          )
        })}
      </div>
    </Frame>
  )
}
