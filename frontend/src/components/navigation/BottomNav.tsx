import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import type { NavItem } from './navItems'

type Props = { items: NavItem[]; className?: string }

// Mobile navigation: fixed to the bottom, five large touch targets.
export function BottomNav({ items, className }: Props) {
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('nav.main')}
      className={cn(
        'border-border bg-surface/95 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden',
        className,
      )}
    >
      {/* One column per item: the app has 5, the admin panel 6. */}
      <ul
        className="mx-auto grid max-w-lg"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(({ to, labelKey, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              end={end}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
                  isActive ? 'text-primary' : 'text-muted hover:text-text',
                )
              }
            >
              <Icon className="size-6" aria-hidden />
              {t(labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
