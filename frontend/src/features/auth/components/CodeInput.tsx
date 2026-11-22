import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../../lib/cn'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}

/** Single field for the 6-digit code: numeric keyboard and code autofill on phones. */
export const CodeInput = forwardRef<HTMLInputElement, Props>(function CodeInput(
  { value, onChange, invalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      aria-invalid={invalid || undefined}
      className={cn(
        'bg-surface-2 ring-border focus:ring-primary h-16 w-full rounded-2xl text-center font-mono text-3xl font-bold tracking-[0.5em] tabular-nums ring-1 ring-inset focus:ring-2 focus:outline-none',
        invalid && 'ring-danger focus:ring-danger',
        className,
      )}
      {...props}
    />
  )
})
