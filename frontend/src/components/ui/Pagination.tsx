import { useTranslation } from 'react-i18next'
import { Button } from './Button'

/** Previous / "Página X de Y" / Next. Renders nothing when everything fits in one page. */
export function Pagination({
  page,
  last,
  onChange,
}: {
  page: number
  last: number
  onChange: (page: number) => void
}) {
  const { t } = useTranslation()
  if (last <= 1) return null

  return (
    <nav className="flex items-center justify-between gap-3" aria-label={t('pagination.label')}>
      <Button variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {t('pagination.previous')}
      </Button>
      <span className="text-muted text-sm">{t('pagination.page', { page, last })}</span>
      <Button variant="ghost" disabled={page >= last} onClick={() => onChange(page + 1)}>
        {t('pagination.next')}
      </Button>
    </nav>
  )
}
