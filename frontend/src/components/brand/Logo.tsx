import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'

// Theme-aware logo built from the brand tokens (see docs/brand). The wordmark uses the
// Barlow Condensed webfont bundled with the app; static SVG files with outlined text live in
// src/assets/brand for places without the font (e-mails, social images).
export function LogoSymbol({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-9 shrink-0', className)} aria-hidden>
      <g transform="skewX(-10) translate(6 0)">
        <path
          d="M10 56 L32 36 L54 56"
          fill="none"
          stroke="var(--secondary)"
          strokeWidth="9"
          strokeLinecap="square"
          opacity=".9"
        />
        <path
          d="M10 34 L32 14 L54 34"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="9"
          strokeLinecap="square"
        />
      </g>
    </svg>
  )
}

export function Logo({ className, showName = true }: { className?: string; showName?: boolean }) {
  const { t } = useTranslation()
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)} aria-label={t('app.name')} role="img">
      <LogoSymbol />
      {showName && (
        <span className="font-display text-[26px] leading-none font-extrabold uppercase italic" aria-hidden>
          Training <span className="text-primary">Up</span>
        </span>
      )}
    </span>
  )
}
