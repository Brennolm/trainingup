import { ChevronDown, Dumbbell, Search, TriangleAlert } from 'lucide-react'
import { useDeferredValue, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { cn } from '../../lib/cn'
import { readStorage, writeStorage } from '../../lib/storage'
import { errorMessage } from '../auth/errors'
import { BODYWEIGHT, EQUIPMENT, MUSCLES } from './exerciseOptions'
import { equipmentLabel, searchable, useExercises, type Exercise } from './exercisesApi'

const ALL = ''

/** Exercises per page the person can pick; few by default keeps the list short on a phone. */
const PAGE_SIZES = [4, 10, 20, 50]
const DEFAULT_PAGE_SIZE = 4
const PAGE_SIZE_KEY = 'trainingup.exercisesPerPage'

function storedPageSize(): number {
  const stored = Number(readStorage(PAGE_SIZE_KEY))
  return PAGE_SIZES.includes(stored) ? stored : DEFAULT_PAGE_SIZE
}

/** Treino → Exercícios (SPEC 6.4): search plus filters by muscle group and equipment, a few per page. */
export function ExerciseLibrary() {
  const { t } = useTranslation()
  const query = useExercises()
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState(ALL)
  const [equipment, setEquipment] = useState(ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(storedPageSize)
  const top = useRef<HTMLDivElement>(null)
  const deferredSearch = useDeferredValue(search)

  // A new search or filter starts again from the first page.
  const filter = (set: (value: string) => void) => (value: string) => {
    set(value)
    setPage(1)
  }
  const changePageSize = (value: string) => {
    setPageSize(Number(value))
    writeStorage(PAGE_SIZE_KEY, value)
    setPage(1)
  }
  const goTo = (next: number) => {
    setPage(next)
    top.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
  }

  const results = useMemo(() => {
    const term = searchable(deferredSearch.trim())
    return (query.data ?? []).filter(
      (e) =>
        (term === '' || searchable(e.name).includes(term)) &&
        (muscle === ALL || e.primary_muscle === muscle) &&
        (equipment === ALL ||
          (equipment === BODYWEIGHT ? e.equipment.length === 0 : e.equipment.includes(equipment as never))),
    )
  }, [query.data, deferredSearch, muscle, equipment])

  const last = Math.max(1, Math.ceil(results.length / pageSize))
  const current = Math.min(page, last)
  const shown = results.slice((current - 1) * pageSize, current * pageSize)

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          label={t('workout.library.search')}
          type="search"
          value={search}
          onChange={(e) => filter(setSearch)(e.target.value)}
          suffix={<Search className="size-4" aria-hidden />}
        />
        <Select
          label={t('workout.library.muscle')}
          value={muscle}
          onChange={(e) => filter(setMuscle)(e.target.value)}
          options={[
            { value: ALL, label: t('workout.library.allMuscles') },
            ...MUSCLES.map((m) => ({ value: m, label: t(`exercise.muscles.${m}`) })),
          ]}
        />
        <Select
          label={t('workout.library.equipment')}
          value={equipment}
          onChange={(e) => filter(setEquipment)(e.target.value)}
          options={[
            { value: ALL, label: t('workout.library.allEquipment') },
            { value: BODYWEIGHT, label: t('exercise.bodyweight') },
            ...EQUIPMENT.map((q) => ({ value: q, label: t(`exercise.equipment.${q}`) })),
          ]}
        />
      </div>

      {query.isPending && <p className="text-muted">{t('appPages.loading')}</p>}
      {query.isError && <Alert tone="error">{errorMessage(query.error, t)}</Alert>}
      {query.data && (
        <>
          <div ref={top} className="flex scroll-mt-4 items-end justify-between gap-3">
            <p className="text-muted pb-3 text-sm" role="status">
              {t('workout.library.count', { count: results.length })}
            </p>
            <Select
              label={t('workout.library.perPage')}
              value={String(pageSize)}
              onChange={(e) => changePageSize(e.target.value)}
              options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
              className="w-28"
            />
          </div>
          {results.length === 0 ? (
            <p className="text-muted">{t('workout.library.empty')}</p>
          ) : (
            <>
              <ul className="grid gap-2" aria-label={t('workout.tabs.library')}>
                {shown.map((e) => (
                  <ExerciseItem key={e.id} exercise={e} />
                ))}
              </ul>
              <Pagination page={current} last={last} onChange={goTo} />
            </>
          )}
        </>
      )}
    </div>
  )
}

function ExerciseItem({ exercise: e }: { exercise: Exercise }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const detailsId = `exercise-${e.id}`

  return (
    <li>
      <Card className="grid gap-0 p-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-11 items-center gap-3 rounded-2xl p-4 text-left"
        >
          <span className="bg-surface-2 text-muted grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl">
            {e.image_url ? (
              <img src={e.image_url} alt="" loading="lazy" className="size-full object-cover" />
            ) : (
              <Dumbbell className="size-6" aria-hidden />
            )}
          </span>
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="font-semibold">{e.name}</span>
            <span className="text-muted text-sm">
              {t(`exercise.muscles.${e.primary_muscle}`)} · {equipmentLabel(e, t)}
            </span>
          </span>
          <ChevronDown
            className={cn('text-muted size-5 shrink-0 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </button>
        {open && (
          <div id={detailsId} className="grid gap-3 px-4 pb-4">
            <ExerciseMedia exercise={e} />
            <dl className="grid gap-2 text-sm">
              <Detail label={t('exercise.fields.level')}>{t(`exercise.levels.${e.level}`)}</Detail>
              <Detail label={t('exercise.fields.pattern')}>
                {t(`exercise.patterns.${e.movement_pattern}`)}
              </Detail>
              {e.secondary_muscles.length > 0 && (
                <Detail label={t('exercise.fields.secondary')}>
                  {e.secondary_muscles.map((m) => t(`exercise.muscles.${m}`)).join(', ')}
                </Detail>
              )}
              {e.contraindications.length > 0 && (
                <div className="bg-warning/10 text-text mt-1 flex gap-2 rounded-xl p-3">
                  <TriangleAlert className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
                  <p>
                    {t('workout.library.caution', {
                      list: e.contraindications.map((i) => t(`exercise.injuries.${i}`)).join(', '),
                    })}
                  </p>
                </div>
              )}
            </dl>
          </div>
        )}
      </Card>
    </li>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted">{label}:</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** Example image (start and end positions), uncropped; nothing when there is none. */
function ExerciseMedia({ exercise: e }: { exercise: Exercise }) {
  const { t } = useTranslation()
  if (!e.image_url) return null
  return (
    <div className="bg-surface-2 mx-auto w-full max-w-md overflow-hidden rounded-xl">
      <img
        src={e.image_url}
        alt={t('workout.library.imageAlt', { name: e.name })}
        loading="lazy"
        className="block h-auto max-h-[70dvh] w-full object-contain"
      />
    </div>
  )
}
