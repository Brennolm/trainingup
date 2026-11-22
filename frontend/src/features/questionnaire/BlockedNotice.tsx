import { HeartPulse } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ROUTES } from '../../routes'

/** SPEC 5.1: respectful block message + what the user can still do (manual plans, logging). */
export function BlockedNotice({ showRectify = true }: { showRectify?: boolean }) {
  const { t } = useTranslation()
  return (
    <section
      aria-labelledby="blocked-title"
      className="bg-warning/10 ring-warning/30 grid gap-3 rounded-2xl p-4 ring-1 ring-inset sm:p-5"
    >
      <h2 id="blocked-title" className="flex items-center gap-2 text-lg font-bold">
        <HeartPulse className="text-warning size-6 shrink-0" aria-hidden />
        {t('questionnaire.blocked.title')}
      </h2>
      <p className="text-sm">{t('questionnaire.blocked.text')}</p>
      <p className="text-sm">{t('questionnaire.blocked.manual')}</p>
      <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold">
        <li>
          <Link to={ROUTES.workout} className="text-primary flex min-h-11 items-center underline">
            {t('questionnaire.blocked.workout')}
          </Link>
        </li>
        <li>
          <Link to={ROUTES.diet} className="text-primary flex min-h-11 items-center underline">
            {t('questionnaire.blocked.diet')}
          </Link>
        </li>
        {showRectify && (
          <li>
            <Link to={ROUTES.myData} className="text-primary flex min-h-11 items-center underline">
              {t('questionnaire.blocked.rectify')}
            </Link>
          </li>
        )}
      </ul>
    </section>
  )
}
