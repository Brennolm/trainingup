// Vocabulary of the exercise base. Keep in sync with backend/app/Support/ExerciseOptions.php.
// Labels: locales/pt-BR.json → exercise.

export const MUSCLES = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'lower_back',
  'quadriceps',
  'hamstrings',
  'glutes',
  'adductors',
  'calves',
] as const
export type Muscle = (typeof MUSCLES)[number]

export const PATTERNS = [
  'squat',
  'hinge',
  'horizontal_push',
  'vertical_push',
  'horizontal_pull',
  'vertical_pull',
  'isolation',
  'core',
] as const
export type Pattern = (typeof PATTERNS)[number]

/** What an exercise needs (all of it). An empty list means body weight only. */
export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bench',
  'pull_up_bar',
  'parallel_bars',
  'kettlebell',
  'band',
] as const
export type Equipment = (typeof EQUIPMENT)[number]

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type Level = (typeof LEVELS)[number]

export const INJURIES = ['shoulder', 'elbow', 'wrist', 'lower_back', 'neck', 'hip', 'knee', 'ankle'] as const
export type Injury = (typeof INJURIES)[number]

/** Filter value for exercises with no equipment. */
export const BODYWEIGHT = 'bodyweight'
