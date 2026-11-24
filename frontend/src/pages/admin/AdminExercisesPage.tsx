import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search } from 'lucide-react'
import { useDeferredValue, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Checkbox } from '../../components/ui/Checkbox'
import { ChoiceGroup, MultiChoice } from '../../components/ui/ChoiceGroup'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/toastContext'
import { adminApi } from '../../features/admin/adminApi'
import { errorMessage } from '../../features/auth/errors'
import {
  EQUIPMENT,
  INJURIES,
  LEVELS,
  MUSCLES,
  PATTERNS,
  type Muscle,
} from '../../features/workout/exerciseOptions'
import {
  EXERCISES_QUERY_KEY,
  equipmentLabel,
  searchable,
  type Exercise,
  type ExerciseInput,
} from '../../features/workout/exercisesApi'
import { ApiError } from '../../lib/api'
import { AdminPage, Badge, Loading } from './AdminParts'
import { ExerciseMediaFields } from './ExerciseMediaFields'

const QUERY_KEY = ['admin', 'exercises'] as const

/** SPEC 6.5: exercise base CRUD. Exercises are deactivated, never deleted. */
export function AdminExercisesPage() {
  const { t } = useTranslation()
  const query = useQuery({ queryKey: QUERY_KEY, queryFn: adminApi.exercises })
  const [search, setSearch] = useState('')
  const deferred = useDeferredValue(search)
  const [editing, setEditing] = useState<Exercise | 'new' | null>(null)

  const results = useMemo(() => {
    const term = searchable(deferred.trim())
    return (query.data ?? []).filter((e) => term === '' || searchable(e.name).includes(term))
  }, [query.data, deferred])

  return (
    <AdminPage title={t('admin.nav.exercises')} intro={t('admin.exercises.intro')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          className="flex-1"
          label={t('admin.exercises.search')}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          suffix={<Search className="size-4" aria-hidden />}
        />
        <Button size="lg" onClick={() => setEditing('new')}>
          <Plus className="size-5" aria-hidden />
          {t('admin.exercises.new')}
        </Button>
      </div>

      {query.isPending && <Loading />}
      {query.isError && <Alert tone="error">{errorMessage(query.error, t)}</Alert>}
      {query.data && (
        <>
          <p className="text-muted text-sm" role="status">
            {t('admin.exercises.count', {
              count: results.length,
              inactive: results.filter((e) => !e.is_active).length,
            })}
          </p>
          <ul className="grid gap-2" aria-label={t('admin.nav.exercises')}>
            {results.map((e) => (
              <li key={e.id}>
                <Card className="flex items-center gap-3 p-4">
                  <div className="grid min-w-0 flex-1 gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{e.name}</span>
                      {!e.is_active && <Badge muted>{t('admin.exercises.inactive')}</Badge>}
                    </div>
                    <span className="text-muted text-sm">
                      {t(`exercise.muscles.${e.primary_muscle}`)} ·{' '}
                      {t(`exercise.patterns.${e.movement_pattern}`)} · {equipmentLabel(e, t)} ·{' '}
                      {t(`exercise.levels.${e.level}`)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setEditing(e)}
                    aria-label={t('admin.exercises.editNamed', { name: e.name })}
                  >
                    <Pencil className="size-4" aria-hidden />
                    <span className="hidden sm:inline">{t('admin.exercises.edit')}</span>
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {editing && (
        <ExerciseFormModal exercise={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </AdminPage>
  )
}

const EMPTY: ExerciseInput = {
  name: '',
  primary_muscle: '' as Muscle,
  secondary_muscles: [],
  movement_pattern: '' as ExerciseInput['movement_pattern'],
  equipment: [],
  level: 'beginner',
  contraindications: [],
  is_active: true,
}

function ExerciseFormModal({ exercise, onClose }: { exercise: Exercise | null; onClose: () => void }) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ExerciseInput>(() => {
    if (!exercise) return EMPTY
    const { id: _id, slug: _slug, image_url: _image, ...input } = exercise
    return input
  })
  // The image is saved on its own (right away); this keeps the preview current.
  const [current, setCurrent] = useState(exercise)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<ApiError | null>(null)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof ExerciseInput>(key: K, value: ExerciseInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const required = (key: 'name' | 'primary_muscle' | 'movement_pattern') =>
    submitted && String(form[key]).trim() === '' ? t('admin.exercises.required') : undefined
  const fieldError = (key: string) => serverError?.field(key) ?? serverError?.field(`${key}.0`) ?? undefined

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setError(null)
    setServerError(null)
    if (!form.name.trim() || !form.primary_muscle || !form.movement_pattern) return

    setSaving(true)
    try {
      const res = current
        ? await adminApi.updateExercise(current.id, form)
        : await adminApi.createExercise(form)
      toast({ title: res.message })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: EXERCISES_QUERY_KEY }),
      ])
      // Just created: stay open so the image can be sent.
      if (current) onClose()
      else setCurrent(res.data)
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) setServerError(err)
      else setError(errorMessage(err, t))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={current ? t('admin.exercises.editTitle') : t('admin.exercises.newTitle')}
    >
      <form onSubmit={save} noValidate className="grid gap-5">
        <Input
          label={t('exercise.fields.name')}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          maxLength={120}
          error={required('name') ?? fieldError('name')}
        />
        <Select
          label={t('exercise.fields.primary')}
          value={form.primary_muscle}
          onChange={(e) => {
            const m = e.target.value as Muscle
            setForm((f) => ({
              ...f,
              primary_muscle: m,
              secondary_muscles: f.secondary_muscles.filter((s) => s !== m),
            }))
          }}
          options={[
            { value: '', label: t('admin.exercises.choose') },
            ...MUSCLES.map((m) => ({ value: m, label: t(`exercise.muscles.${m}`) })),
          ]}
          error={required('primary_muscle') ?? fieldError('primary_muscle')}
        />
        <MultiChoice
          label={t('exercise.fields.secondary')}
          values={form.secondary_muscles}
          onChange={(v) => set('secondary_muscles', v)}
          options={MUSCLES.filter((m) => m !== form.primary_muscle).map((m) => ({
            value: m,
            label: t(`exercise.muscles.${m}`),
          }))}
          error={fieldError('secondary_muscles')}
        />
        <Select
          label={t('exercise.fields.pattern')}
          value={form.movement_pattern}
          onChange={(e) => set('movement_pattern', e.target.value as ExerciseInput['movement_pattern'])}
          options={[
            { value: '', label: t('admin.exercises.choose') },
            ...PATTERNS.map((p) => ({ value: p, label: t(`exercise.patterns.${p}`) })),
          ]}
          error={required('movement_pattern') ?? fieldError('movement_pattern')}
        />
        <MultiChoice
          label={t('exercise.fields.equipment')}
          hint={t('admin.exercises.equipmentHint')}
          values={form.equipment}
          onChange={(v) => set('equipment', v)}
          options={EQUIPMENT.map((q) => ({ value: q, label: t(`exercise.equipment.${q}`) }))}
          error={fieldError('equipment')}
        />
        <ChoiceGroup
          label={t('exercise.fields.level')}
          hint={t('admin.exercises.levelHint')}
          layout="row"
          value={form.level}
          onChange={(v) => set('level', v)}
          options={LEVELS.map((l) => ({ value: l, label: t(`exercise.levels.${l}`) }))}
          error={fieldError('level')}
        />
        <MultiChoice
          label={t('exercise.fields.contraindications')}
          hint={t('admin.exercises.contraindicationsHint')}
          values={form.contraindications}
          onChange={(v) => set('contraindications', v)}
          options={INJURIES.map((i) => ({ value: i, label: t(`exercise.injuries.${i}`) }))}
          error={fieldError('contraindications')}
        />
        {current ? (
          <ExerciseMediaFields exercise={current} onChange={setCurrent} />
        ) : (
          <p className="text-muted text-sm">{t('admin.exercises.media.afterCreate')}</p>
        )}
        <Checkbox
          label={t('admin.exercises.active')}
          checked={form.is_active}
          onChange={(e) => set('is_active', e.target.checked)}
        />

        {(error || (serverError && !hasKnownField(serverError))) && (
          <Alert tone="error">{error ?? serverError?.message}</Alert>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={saving}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

const FIELDS = [
  'name',
  'primary_muscle',
  'secondary_muscles',
  'movement_pattern',
  'equipment',
  'level',
  'contraindications',
]

function hasKnownField(error: ApiError) {
  return Object.keys(error.errors).some((k) => FIELDS.includes(k.split('.')[0]))
}
