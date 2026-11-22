import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Later classes win over conflicting earlier ones (e.g. a `hidden` passed to a Button
// overrides the base `inline-flex`).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
