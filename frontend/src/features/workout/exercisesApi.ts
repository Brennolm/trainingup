import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Equipment, Injury, Level, Muscle, Pattern } from './exerciseOptions'

export type Exercise = {
  id: number
  slug: string
  name: string
  primary_muscle: Muscle
  secondary_muscles: Muscle[]
  movement_pattern: Pattern
  equipment: Equipment[]
  level: Level
  contraindications: Injury[]
  /** Example image, start and end positions side by side (null until there is one). */
  image_url: string | null
  is_active: boolean
}

/** The fields an admin edits (the slug is set once by the API). */
export type ExerciseInput = Omit<Exercise, 'id' | 'slug' | 'image_url'>

export const EXERCISES_QUERY_KEY = ['exercises'] as const

export function useExercises() {
  return useQuery({
    queryKey: EXERCISES_QUERY_KEY,
    queryFn: async () => (await api.get<{ data: Exercise[] }>('/api/exercises')).data,
    staleTime: 60 * 60 * 1000, // the base changes rarely
  })
}

/** Case- and accent-insensitive text for search. */
export function searchable(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** "Halteres, Banco" or "Peso do corpo". */
export function equipmentLabel(exercise: Pick<Exercise, 'equipment'>, t: (key: string) => string) {
  return exercise.equipment.length === 0
    ? t('exercise.bodyweight')
    : exercise.equipment.map((q) => t(`exercise.equipment.${q}`)).join(', ')
}
