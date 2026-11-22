import { Check, Dumbbell, Play, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LogoSymbol } from '../../components/brand/Logo'
import { cn } from '../../lib/cn'

// Illustration of the "Hoje" screen, drawn with the real design tokens (follows the theme).
export function PhoneMockup({ className }: { className?: string }) {
  const { t } = useTranslation()
  const meals = [
    { label: t('landing.mockup.meal1'), done: true },
    { label: t('landing.mockup.meal2'), done: true },
    { label: t('landing.mockup.meal3'), done: false },
  ]

  return (
    <div
      role="img"
      aria-label={t('landing.mockup.label')}
      className={cn(
        'bg-surface ring-border relative w-[17.5rem] rounded-[2.75rem] p-2.5 shadow-2xl ring-1 select-none',
        className,
      )}
    >
      <div aria-hidden className="bg-bg grid gap-3 overflow-hidden rounded-[2.25rem] px-4 pt-3 pb-5">
        {/* status bar + notch */}
        <div className="relative flex h-6 items-center justify-between px-1 text-[10px] font-semibold">
          <span>9:41</span>
          <span className="bg-surface absolute left-1/2 h-5 w-20 -translate-x-1/2 rounded-full" />
          <span className="flex gap-0.5">
            <span className="bg-text h-2 w-0.5 rounded-sm" />
            <span className="bg-text h-2.5 w-0.5 rounded-sm" />
            <span className="bg-text h-3 w-0.5 rounded-sm" />
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-xl leading-tight font-extrabold uppercase italic">
              {t('landing.mockup.greeting')}
            </p>
            <p className="text-muted text-[11px]">{t('landing.mockup.date')}</p>
          </div>
          <LogoSymbol className="size-7" />
        </div>

        <div className="bg-surface ring-border grid gap-2 rounded-2xl p-3 ring-1">
          <p className="text-muted flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase">
            <Dumbbell className="size-3" />
            {t('landing.mockup.workoutLabel')}
          </p>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="font-display text-lg leading-none font-extrabold uppercase italic">
                {t('landing.mockup.workoutName')}
              </p>
              <p className="text-muted mt-1 text-[11px]">{t('landing.mockup.workoutDetail')}</p>
            </div>
            <span className="bg-primary text-on-primary flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold">
              <Play className="size-3 fill-current" />
              {t('landing.mockup.start')}
            </span>
          </div>
        </div>

        <div className="bg-surface ring-border grid gap-1.5 rounded-2xl p-3 ring-1">
          <p className="text-muted text-[10px] font-semibold tracking-wider uppercase">
            {t('landing.mockup.mealsLabel')}
          </p>
          {meals.map((m) => (
            <div key={m.label} className="flex items-center justify-between text-xs">
              <span className={m.done ? 'text-text' : 'text-muted'}>{m.label}</span>
              <span
                className={cn(
                  'grid size-5 place-items-center rounded-md',
                  m.done ? 'bg-primary text-on-primary' : 'ring-border ring-1 ring-inset',
                )}
              >
                {m.done && <Check className="size-3" strokeWidth={3.5} />}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface ring-border grid gap-1 rounded-2xl p-3 ring-1">
            <p className="text-muted flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase">
              <Scale className="size-3" />
              {t('landing.mockup.weightLabel')}
            </p>
            <p className="text-base font-semibold tabular-nums">{t('landing.mockup.weightValue')}</p>
            <p className="text-success text-[10px]">{t('landing.mockup.weightTrend')}</p>
          </div>
          <div className="bg-surface ring-border grid gap-1.5 rounded-2xl p-3 ring-1">
            <p className="text-muted text-[10px] font-semibold tracking-wider uppercase">
              {t('landing.mockup.weekLabel')}
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={cn('h-2 flex-1 rounded-full', n <= 3 ? 'bg-primary' : 'bg-surface-2')}
                />
              ))}
            </div>
            <p className="text-[11px] font-semibold">{t('landing.mockup.weekValue')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
