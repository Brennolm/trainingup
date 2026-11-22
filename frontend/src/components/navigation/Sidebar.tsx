import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { Logo } from '../brand/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'
import type { NavItem } from './navItems'

type Props = { items: NavItem[]; className?: string }

// Desktop navigation: same items as the bottom nav.
export function Sidebar({ items, className }: Props) {
  const { t } = useTranslation()
  return (
    <aside
      className={cn(
        'border-border bg-surface sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 border-r px-4 py-6 md:flex',
        className,
      )}
    >
      <div className="px-2">
        <Logo />
      </div>
      <nav aria-label={t('nav.main')} className="flex-1">
        <ul className="grid gap-1">
          {items.map(({ to, labelKey, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex h-11 items-center gap-3 rounded-xl px-3 font-semibold transition-colors',
                    isActive ? 'bg-primary/12 text-primary' : 'text-muted hover:bg-surface-2 hover:text-text',
                  )
                }
              >
                <Icon className="size-5" aria-hidden />
                {t(labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="text-muted flex items-center justify-between px-2 text-sm">
        {t('theme.label')}
        <ThemeToggle />
      </div>
    </aside>
  )
}
