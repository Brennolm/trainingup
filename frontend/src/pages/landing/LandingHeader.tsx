import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Logo } from '../../components/brand/Logo'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { cn } from '../../lib/cn'
import { ROUTES } from '../../routes'
import { SECTION_IDS } from './sectionIds'

export function LandingHeader() {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const anchors = [
    { id: SECTION_IDS.howItWorks, label: t('landing.nav.howItWorks') },
    { id: SECTION_IDS.features, label: t('landing.nav.features') },
    { id: SECTION_IDS.faq, label: t('landing.nav.faq') },
  ]

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)] transition-colors duration-200',
        scrolled || menuOpen
          ? 'bg-bg/90 border-border border-b backdrop-blur-md'
          : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to={ROUTES.home} className="rounded-lg">
          <Logo />
        </Link>

        <nav aria-label={t('landing.nav.label')} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {anchors.map((a) => (
              <li key={a.id}>
                <a
                  href={`#${a.id}`}
                  className="text-muted hover:text-text rounded-lg px-3 py-2 font-semibold transition-colors"
                >
                  {a.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink to={ROUTES.signIn} variant="ghost" className="hidden md:inline-flex">
            {t('auth.signIn')}
          </ButtonLink>
          {/* Small phones: logo + menu only (sign-up is in the menu and in the hero CTA). */}
          <ButtonLink to={ROUTES.signUp} className="hidden px-4 sm:inline-flex">
            {t('auth.signUp')}
          </ButtonLink>
          <button
            type="button"
            className="text-text hover:bg-surface-2 grid h-11 w-11 place-items-center rounded-xl md:hidden"
            aria-expanded={menuOpen}
            aria-controls="landing-menu"
            aria-label={menuOpen ? t('landing.nav.closeMenu') : t('landing.nav.openMenu')}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="landing-menu" aria-label={t('landing.nav.label')} className="px-4 pb-4 md:hidden">
          <ul className="grid gap-1">
            {anchors.map((a) => (
              <li key={a.id}>
                <a
                  href={`#${a.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="hover:bg-surface-2 flex h-12 items-center rounded-xl px-3 text-lg font-semibold"
                >
                  {a.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                to={ROUTES.signIn}
                className="hover:bg-surface-2 flex h-12 items-center rounded-xl px-3 text-lg font-semibold"
              >
                {t('auth.signIn')}
              </Link>
            </li>
            <li className="pt-2 sm:hidden">
              <ButtonLink to={ROUTES.signUp} size="lg" fullWidth>
                {t('auth.signUp')}
              </ButtonLink>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
