import type { Questionnaire } from '../features/questionnaire/types'

export const NO_PAR_Q = [false, false, false, false, false, false, false]

/** A draft with nothing answered yet. */
export function emptyQuestionnaire(overrides: Partial<Questionnaire> = {}): Questionnaire {
  return {
    version: 1,
    personal: { sex: null, height_cm: null, weight_kg: null },
    health: null,
    routine: { work_activity: null },
    goal: { goal: null, goal_pace: null },
    training: {
      experience: null,
      training_days: null,
      session_minutes: null,
      training_location: null,
      wants_cardio: null,
      cardio_preference: null,
    },
    diet: { diet_restrictions: null, meals_per_day: null, diet_split: null },
    filled_sections: [],
    blocked: false,
    disclaimer_accepted_at: null,
    completed_at: null,
    updated_at: '2026-11-22T12:00:00Z',
    ...overrides,
  }
}

/** Every section answered (draft unless completed_at is given). */
export function filledQuestionnaire(overrides: Partial<Questionnaire> = {}): Questionnaire {
  return emptyQuestionnaire({
    personal: { sex: 'female', height_cm: 165, weight_kg: 62.5 },
    health: {
      par_q: NO_PAR_Q,
      pregnant_or_lactating: false,
      conditions: [],
      result: 'clear',
      rectified_at: null,
    },
    routine: { work_activity: 'sedentary' },
    goal: { goal: 'lose_fat', goal_pace: 'moderate' },
    training: {
      experience: 'beginner',
      training_days: ['mon', 'wed', 'fri'],
      session_minutes: 60,
      training_location: 'gym',
      wants_cardio: true,
      cardio_preference: 'walking',
    },
    diet: { diet_restrictions: ['lactose_free'], meals_per_day: 5, diet_split: 'single' },
    filled_sections: ['personal', 'health', 'routine', 'goal', 'training', 'diet'],
    ...overrides,
  })
}

export const blockedHealth: Questionnaire['health'] = {
  par_q: NO_PAR_Q,
  pregnant_or_lactating: false,
  conditions: ['hypertension'],
  result: 'blocked',
  rectified_at: null,
}
