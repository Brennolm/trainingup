import type {
  CARDIO_PREFERENCES,
  DIET_RESTRICTIONS,
  DIET_SPLITS,
  EXPERIENCE,
  GOAL_PACES,
  GOALS,
  HEALTH_CONDITIONS,
  Section,
  SEXES,
  TRAINING_LOCATIONS,
  WEEKDAYS,
  WORK_ACTIVITY,
} from './options'

export type Sex = (typeof SEXES)[number]
export type WorkActivity = (typeof WORK_ACTIVITY)[number]
export type Goal = (typeof GOALS)[number]
export type GoalPace = (typeof GOAL_PACES)[number]
export type Experience = (typeof EXPERIENCE)[number]
export type Weekday = (typeof WEEKDAYS)[number]
export type TrainingLocation = (typeof TRAINING_LOCATIONS)[number]
export type CardioPreference = (typeof CARDIO_PREFERENCES)[number]
export type DietRestriction = (typeof DIET_RESTRICTIONS)[number]
export type DietSplit = (typeof DIET_SPLITS)[number]
export type HealthCondition = (typeof HEALTH_CONDITIONS)[number]

export type HealthAnswers = {
  par_q: boolean[]
  /** Only asked to women; null otherwise. */
  pregnant_or_lactating: boolean | null
  conditions: HealthCondition[]
}

/** Current version of the questionnaire, as the API returns it (metric units). */
export type Questionnaire = {
  version: number
  personal: { sex: Sex | null; height_cm: number | null; weight_kg: number | null }
  health: (HealthAnswers & { result: 'clear' | 'blocked'; rectified_at: string | null }) | null
  routine: { work_activity: WorkActivity | null }
  goal: { goal: Goal | null; goal_pace: GoalPace | null }
  training: {
    experience: Experience | null
    training_days: Weekday[] | null
    session_minutes: number | null
    training_location: TrainingLocation | null
    wants_cardio: boolean | null
    cardio_preference: CardioPreference | null
  }
  diet: {
    diet_restrictions: DietRestriction[] | null
    meals_per_day: number | null
    diet_split: DietSplit | null
  }
  filled_sections: Section[]
  blocked: boolean
  disclaimer_accepted_at: string | null
  completed_at: string | null
  updated_at: string | null
}

export type QuestionnaireState = { data: Questionnaire | null; health_consent: boolean }
