import type { Exercise } from '../features/workout/exercisesApi'

export function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 1,
    slug: 'supino-reto-halteres',
    name: 'Supino reto com halteres',
    primary_muscle: 'chest',
    secondary_muscles: ['triceps', 'shoulders'],
    movement_pattern: 'horizontal_push',
    equipment: ['dumbbell', 'bench'],
    level: 'beginner',
    contraindications: ['shoulder'],
    image_url: null,
    is_active: true,
    ...overrides,
  }
}

export const sampleExercises: Exercise[] = [
  makeExercise(),
  makeExercise({
    id: 2,
    slug: 'agachamento-livre',
    name: 'Agachamento livre com barra',
    primary_muscle: 'quadriceps',
    secondary_muscles: ['glutes'],
    movement_pattern: 'squat',
    equipment: ['barbell'],
    level: 'intermediate',
    contraindications: ['knee', 'lower_back'],
  }),
  makeExercise({
    id: 3,
    slug: 'flexao',
    name: 'Flexão de braços',
    secondary_muscles: [],
    equipment: [],
    contraindications: [],
  }),
]
