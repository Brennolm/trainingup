import { useQueryClient } from '@tanstack/react-query'
import { ImageOff, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/toastContext'
import { adminApi } from '../../features/admin/adminApi'
import { shrinkImage } from '../../features/admin/shrinkImage'
import { errorMessage } from '../../features/auth/errors'
import { EXERCISES_QUERY_KEY, type Exercise } from '../../features/workout/exercisesApi'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Example image of an exercise (start and end positions side by side), sent or removed right
 * away. It is shrunk in the browser first, so a large generated PNG fits the API's 1 MB limit.
 */
export function ExerciseMediaFields({
  exercise,
  onChange,
}: {
  exercise: Exercise
  onChange: (exercise: Exercise) => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const url = exercise.image_url

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'exercises'] }),
      queryClient.invalidateQueries({ queryKey: EXERCISES_QUERY_KEY }),
    ])

  const run = async (
    action: 'upload' | 'remove',
    request: () => Promise<{ data: Exercise }>,
    done: string,
  ) => {
    setBusy(action)
    try {
      const res = await request()
      onChange(res.data)
      toast({ title: t(done) })
      await refresh()
    } catch (err) {
      setError(errorMessage(err, t))
    } finally {
      setBusy(null)
    }
  }

  const upload = async (file: File | undefined) => {
    if (input.current) input.current.value = ''
    if (!file) return
    setError(null)
    if (!IMAGE_TYPES.includes(file.type)) return setError(t('admin.exercises.media.imageType'))

    setBusy('upload')
    const small = await shrinkImage(file, exercise.slug)
    if (!small) {
      setBusy(null)
      return setError(t('admin.exercises.media.unreadable'))
    }
    await run(
      'upload',
      () => adminApi.uploadExerciseImage(exercise.id, small),
      'admin.exercises.media.imageSaved',
    )
  }

  const remove = () => {
    setError(null)
    return run(
      'remove',
      () => adminApi.removeExerciseImage(exercise.id),
      'admin.exercises.media.imageRemoved',
    )
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="text-text mb-1 text-base font-semibold">{t('admin.exercises.media.title')}</legend>
      <p className="text-muted -mt-1 text-sm">{t('admin.exercises.media.hint')}</p>
      <div className="bg-surface-2 ring-border grid gap-3 rounded-xl p-3 ring-1 ring-inset">
        <div className="bg-surface mx-auto grid aspect-square w-full max-w-xs place-items-center overflow-hidden rounded-lg">
          {url ? (
            <img
              src={url}
              alt={t('admin.exercises.media.imageAlt', { name: exercise.name })}
              className="size-full object-contain"
            />
          ) : (
            <span className="text-muted grid justify-items-center gap-1 text-sm">
              <ImageOff className="size-6" aria-hidden />
              {t('admin.exercises.media.noImage')}
            </span>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept={IMAGE_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-label={t('admin.exercises.media.pickImage')}
          onChange={(e) => upload(e.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            loading={busy === 'upload'}
            disabled={busy !== null}
            onClick={() => input.current?.click()}
            aria-describedby={error ? 'media-image-error' : undefined}
          >
            <Upload className="size-4" aria-hidden />
            {t(url ? 'admin.exercises.media.replaceImage' : 'admin.exercises.media.sendImage')}
          </Button>
          {url && (
            <Button
              variant="ghost"
              loading={busy === 'remove'}
              disabled={busy !== null}
              onClick={remove}
              aria-label={t('admin.exercises.media.removeImage')}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          )}
        </div>
        <p className="text-muted text-xs">{t('admin.exercises.media.imageLimits')}</p>
        {error && (
          <p id="media-image-error" className="text-danger text-sm">
            {error}
          </p>
        )}
      </div>
    </fieldset>
  )
}
