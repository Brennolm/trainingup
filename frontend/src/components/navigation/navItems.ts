import { CalendarCheck, Dumbbell, LineChart, Salad, User, type LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  labelKey: string
  icon: LucideIcon
  /** Active only on this exact path. */ end?: boolean
}

// The five sections of the app (SPEC 6.4). Routes are wired in later phases.
export const NAV_ITEMS: NavItem[] = [
  { to: '/hoje', labelKey: 'nav.today', icon: CalendarCheck },
  { to: '/treino', labelKey: 'nav.workout', icon: Dumbbell },
  { to: '/dieta', labelKey: 'nav.diet', icon: Salad },
  { to: '/progresso', labelKey: 'nav.progress', icon: LineChart },
  { to: '/perfil', labelKey: 'nav.profile', icon: User },
]
