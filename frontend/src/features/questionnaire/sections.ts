import type { TFunction } from 'i18next'
import type { ComponentType } from 'react'
import { formatLength, formatWeight } from '../../lib/units'
import type { User } from '../auth/types'
import { SECTIONS, WEEKDAYS, type Section } from './options'
import type { StepProps } from './StepForm'
import { HealthStep } from './steps/HealthStep'
import { PersonalStep } from './steps/PersonalStep'
import { DietStep, GoalStep, RoutineStep, TrainingStep } from './steps/SimpleSteps'
import type { Questionnaire } from './types'

export const STEP_COMPONENTS: Record<Section, ComponentType<StepProps>> = {
  personal: PersonalStep,
  health: HealthStep,
  routine: RoutineStep,
  goal: GoalStep,
  training: TrainingStep,
  diet: DietStep,
}

/** Where the wizard resumes: first section still missing answers, or the summary (index 6). */
export function firstMissingStep(q: Questionnaire): number {
  const index = SECTIONS.findIndex((s) => !q.filled_sections.includes(s))
  return index === -1 ? SECTIONS.length : index
}

export type SummaryItem = { label: string; value: string }

/** Answers of one section in plain words (Resumo and Perfil → Meus dados). */
export function describeSection(
  section: Section,
  q: Questionnaire,
  t: TFunction,
  prefs: User['preferences'],
): SummaryItem[] {
  const dash = '—'
  const opt = (group: string, value: string | null) =>
    value === null ? dash : t(`questionnaire.options.${group}.${value}`)
  const list = (group: string, values: string[] | null, empty: string) =>
    values === null ? dash : values.length ? values.map((v) => opt(group, v)).join(', ') : empty

  switch (section) {
    case 'personal': {
      const p = q.personal
      return [
        { label: t('questionnaire.personal.sex'), value: opt('sex', p.sex) },
        {
          label: t('questionnaire.personal.height'),
          value: p.height_cm === null ? dash : formatLength(p.height_cm, prefs.length_unit),
        },
        {
          label: t('questionnaire.personal.weight'),
          value: p.weight_kg === null ? dash : formatWeight(p.weight_kg, prefs.weight_unit),
        },
      ]
    }
    case 'health': {
      const h = q.health
      if (!h) return [{ label: t('questionnaire.health.parQTitle'), value: dash }]
      const yes = h.par_q.filter(Boolean).length
      const items: SummaryItem[] = [
        {
          label: t('questionnaire.health.parQTitle'),
          value: yes ? t('questionnaire.summary.parQYes', { count: yes }) : t('questionnaire.summary.allNo'),
        },
      ]
      if (q.personal.sex === 'female') {
        items.push({
          label: t('questionnaire.summary.pregnant'),
          value:
            h.pregnant_or_lactating === null
              ? dash
              : t(h.pregnant_or_lactating ? 'questionnaire.yes' : 'questionnaire.no'),
        })
      }
      items.push({
        label: t('questionnaire.summary.conditions'),
        value: list('conditions', h.conditions, t('questionnaire.health.none')),
      })
      return items
    }
    case 'routine':
      return [{ label: t('questionnaire.routine.work'), value: opt('work', q.routine.work_activity) }]
    case 'goal':
      return [
        { label: t('questionnaire.goal.goal'), value: opt('goal', q.goal.goal) },
        ...(q.goal.goal_pace
          ? [{ label: t('questionnaire.goal.pace'), value: opt('pace', q.goal.goal_pace) }]
          : []),
      ]
    case 'training': {
      const tr = q.training
      const days = tr.training_days ? WEEKDAYS.filter((d) => tr.training_days?.includes(d)) : null
      return [
        { label: t('questionnaire.training.experience'), value: opt('experience', tr.experience) },
        {
          label: t('questionnaire.summary.days'),
          value: days ? `${days.length}× · ${list('weekday', days, dash)}` : dash,
        },
        {
          label: t('questionnaire.training.minutes'),
          value:
            tr.session_minutes === null
              ? dash
              : t(
                  tr.session_minutes >= 75
                    ? 'questionnaire.training.minutesMax'
                    : 'questionnaire.training.minutesValue',
                  {
                    minutes: tr.session_minutes,
                  },
                ),
        },
        { label: t('questionnaire.training.location'), value: opt('location', tr.training_location) },
        {
          label: t('questionnaire.summary.cardio'),
          value:
            tr.wants_cardio === null
              ? dash
              : tr.wants_cardio
                ? opt('cardio', tr.cardio_preference)
                : t('questionnaire.no'),
        },
      ]
    }
    case 'diet': {
      const d = q.diet
      return [
        {
          label: t('questionnaire.summary.restrictions'),
          value: list('restriction', d.diet_restrictions, t('questionnaire.summary.noRestrictions')),
        },
        {
          label: t('questionnaire.diet.meals'),
          value: d.meals_per_day === null ? dash : String(d.meals_per_day),
        },
        { label: t('questionnaire.diet.split'), value: opt('split', d.diet_split) },
      ]
    }
  }
}
