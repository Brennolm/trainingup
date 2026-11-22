import { Check, Circle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../../lib/cn'
import { PASSWORD_RULES } from '../schemas'

/** Live checklist of the password requirements (SPEC 6.2: requirements visible). */
export function PasswordRules({ value, id }: { value: string; id?: string }) {
  const { t } = useTranslation()
  return (
    <div id={id} className="grid gap-1.5 text-sm">
      <p className="text-muted">{t('auth.passwordRules.title')}</p>
      <ul className="grid gap-1">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(value)
          return (
            <li key={rule.key} className={cn('flex items-center gap-2', met ? 'text-success' : 'text-muted')}>
              {met ? (
                <Check className="size-4" strokeWidth={3} aria-hidden />
              ) : (
                <Circle className="size-4" aria-hidden />
              )}
              <span>{t(`auth.passwordRules.${rule.key}`)}</span>
              <span className="sr-only">
                ({met ? t('auth.passwordRules.met') : t('auth.passwordRules.unmet')})
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
