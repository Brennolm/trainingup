// Allowed answers (SPEC 6.3). Keep in sync with backend/app/Support/QuestionnaireOptions.php.
// Labels: locales/pt-BR.json → questionnaire.options.

export const SECTIONS = ['personal', 'health', 'routine', 'goal', 'training', 'diet'] as const
export type Section = (typeof SECTIONS)[number]

export const SEXES = ['male', 'female'] as const
export const HEIGHT_CM = { min: 120, max: 230 }
export const WEIGHT_KG = { min: 30, max: 300 }
export const WORK_ACTIVITY = ['sedentary', 'standing', 'active'] as const
export const GOALS = ['lose_fat', 'maintain', 'gain_muscle'] as const
export const GOAL_PACES = ['light', 'moderate'] as const
export const EXPERIENCE = ['beginner', 'intermediate', 'advanced'] as const
export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export const TRAINING_DAYS = { min: 2, max: 6 }
export const SESSION_MINUTES = [30, 45, 60, 75] as const
export const TRAINING_LOCATIONS = ['gym', 'building_gym', 'home'] as const
export const CARDIO_PREFERENCES = ['walking', 'running', 'cycling', 'elliptical', 'any'] as const
export const DIET_RESTRICTIONS = ['vegetarian', 'vegan', 'lactose_free', 'gluten_free'] as const
export const MEALS_PER_DAY = [3, 4, 5, 6] as const
export const DIET_SPLITS = ['single', 'training_rest'] as const
export const PAR_Q_QUESTIONS = 7
export const HEALTH_CONDITIONS = [
  'diabetes',
  'hypertension',
  'heart_disease',
  'kidney_disease',
  'liver_disease',
  'eating_disorder',
  'other',
] as const

/** URL slugs (pt-BR) of each section in Perfil → Meus dados. */
export const SECTION_SLUGS: Record<Section, string> = {
  personal: 'sobre-voce',
  health: 'saude',
  routine: 'rotina',
  goal: 'objetivo',
  training: 'treino',
  diet: 'alimentacao',
}

export function sectionFromSlug(slug: string | undefined): Section | undefined {
  return SECTIONS.find((s) => SECTION_SLUGS[s] === slug)
}
