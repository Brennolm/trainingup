import { Clock } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChoiceGroup, MultiChoice } from '../../../components/ui/ChoiceGroup'
import {
  CARDIO_PREFERENCES,
  DIET_RESTRICTIONS,
  DIET_SPLITS,
  EXPERIENCE,
  GOAL_PACES,
  GOALS,
  MEALS_PER_DAY,
  SESSION_MINUTES,
  TRAINING_DAYS,
  TRAINING_LOCATIONS,
  WEEKDAYS,
  WORK_ACTIVITY,
} from '../options'
import { StepForm, type StepProps } from '../StepForm'
import type {
  CardioPreference,
  DietRestriction,
  DietSplit,
  Experience,
  Goal,
  GoalPace,
  TrainingLocation,
  Weekday,
  WorkActivity,
} from '../types'

/** Questions that arrive with later phases (equipment/injuries: 8; foods: 10). */
export function ComingSoonNote({ title, text }: { title: string; text: string }) {
  const { t } = useTranslation()
  return (
    <div className="ring-border ring-dashed grid gap-1 rounded-xl p-4 ring-1 ring-inset">
      <span className="text-muted flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
        <Clock className="size-4" aria-hidden />
        {t('questionnaire.soon')}
      </span>
      <span className="font-semibold">{title}</span>
      <span className="text-muted text-sm">{text}</span>
    </div>
  )
}

function useRequired() {
  const { t } = useTranslation()
  const [showErrors, setShowErrors] = useState(false)
  return {
    /** Called by build() when an answer is missing: shows the field errors, sends nothing. */
    missing: () => {
      setShowErrors(true)
      return null
    },
    error: (isMissing: boolean, message = t('questionnaire.required')) =>
      showErrors && isMissing ? message : undefined,
  }
}

/** Step 3 · Rotina. */
export function RoutineStep(props: StepProps) {
  const { t } = useTranslation()
  const [work, setWork] = useState<WorkActivity | null>(props.questionnaire.routine.work_activity)
  const { missing, error } = useRequired()

  const build = () => {
    if (!work) return missing()
    return { work_activity: work }
  }

  return (
    <StepForm section="routine" build={build} {...props}>
      <ChoiceGroup<WorkActivity>
        label={t('questionnaire.routine.work')}
        value={work}
        onChange={setWork}
        options={WORK_ACTIVITY.map((v) => ({
          value: v,
          label: t(`questionnaire.options.work.${v}`),
          description: t(`questionnaire.options.workHint.${v}`),
        }))}
        error={error(!work)}
      />
    </StepForm>
  )
}

/** Step 4 · Objetivo (pace only when losing fat or gaining muscle). */
export function GoalStep(props: StepProps) {
  const { t } = useTranslation()
  const saved = props.questionnaire.goal
  const [goal, setGoal] = useState<Goal | null>(saved.goal)
  const [pace, setPace] = useState<GoalPace | null>(saved.goal_pace)
  const { missing, error } = useRequired()
  const needsPace = goal !== null && goal !== 'maintain'

  const build = () => {
    if (!goal || (needsPace && !pace)) return missing()
    return { goal, goal_pace: needsPace ? pace : null }
  }

  return (
    <StepForm section="goal" build={build} {...props}>
      <ChoiceGroup<Goal>
        label={t('questionnaire.goal.goal')}
        value={goal}
        onChange={setGoal}
        options={GOALS.map((v) => ({ value: v, label: t(`questionnaire.options.goal.${v}`) }))}
        error={error(!goal)}
      />
      {needsPace && (
        <ChoiceGroup<GoalPace>
          label={t('questionnaire.goal.pace')}
          value={pace}
          onChange={setPace}
          options={GOAL_PACES.map((v) => ({
            value: v,
            label: t(`questionnaire.options.pace.${v}`),
            description: t(`questionnaire.options.paceHint.${goal}.${v}`),
          }))}
          error={error(!pace)}
        />
      )}
    </StepForm>
  )
}

/** Step 5 · Treino. Equipment and injuries arrive with the exercise base (phase 8). */
export function TrainingStep(props: StepProps) {
  const { t } = useTranslation()
  const saved = props.questionnaire.training
  const [experience, setExperience] = useState<Experience | null>(saved.experience)
  const [days, setDays] = useState<Weekday[]>(saved.training_days ?? [])
  const [minutes, setMinutes] = useState<number | null>(saved.session_minutes)
  const [location, setLocation] = useState<TrainingLocation | null>(saved.training_location)
  const [cardio, setCardio] = useState<boolean | null>(saved.wants_cardio)
  const [cardioPref, setCardioPref] = useState<CardioPreference | null>(saved.cardio_preference)
  const { missing, error } = useRequired()
  const daysOk = days.length >= TRAINING_DAYS.min && days.length <= TRAINING_DAYS.max

  const build = () => {
    if (!experience || !daysOk || !minutes || !location || cardio === null || (cardio && !cardioPref)) {
      return missing()
    }
    return {
      experience,
      training_days: WEEKDAYS.filter((d) => days.includes(d)),
      session_minutes: minutes,
      training_location: location,
      wants_cardio: cardio,
      cardio_preference: cardio ? cardioPref : null,
    }
  }

  return (
    <StepForm section="training" build={build} {...props}>
      <ChoiceGroup<Experience>
        label={t('questionnaire.training.experience')}
        value={experience}
        onChange={setExperience}
        options={EXPERIENCE.map((v) => ({
          value: v,
          label: t(`questionnaire.options.experience.${v}`),
          description: t(`questionnaire.options.experienceHint.${v}`),
        }))}
        error={error(!experience)}
      />
      <MultiChoice<Weekday>
        label={t('questionnaire.training.days')}
        hint={t('questionnaire.training.daysHint', { selected: days.length })}
        values={days}
        onChange={setDays}
        layout="grid"
        options={WEEKDAYS.map((v) => ({ value: v, label: t(`questionnaire.options.weekday.${v}`) }))}
        error={error(!daysOk, t('questionnaire.training.daysError'))}
      />
      <ChoiceGroup<number>
        label={t('questionnaire.training.minutes')}
        layout="grid"
        value={minutes}
        onChange={setMinutes}
        options={SESSION_MINUTES.map((v) => ({
          value: v,
          label: t(v === 75 ? 'questionnaire.training.minutesMax' : 'questionnaire.training.minutesValue', {
            minutes: v,
          }),
        }))}
        error={error(!minutes)}
      />
      <ChoiceGroup<TrainingLocation>
        label={t('questionnaire.training.location')}
        value={location}
        onChange={setLocation}
        options={TRAINING_LOCATIONS.map((v) => ({
          value: v,
          label: t(`questionnaire.options.location.${v}`),
          description: t(`questionnaire.options.locationHint.${v}`),
        }))}
        error={error(!location)}
      />
      <ComingSoonNote
        title={t('questionnaire.training.equipmentSoon')}
        text={t('questionnaire.training.equipmentSoonText')}
      />
      <ChoiceGroup<boolean>
        label={t('questionnaire.training.cardio')}
        layout="row"
        value={cardio}
        onChange={setCardio}
        options={[
          { value: true, label: t('questionnaire.yes') },
          { value: false, label: t('questionnaire.no') },
        ]}
        error={error(cardio === null)}
      />
      {cardio && (
        <ChoiceGroup<CardioPreference>
          label={t('questionnaire.training.cardioPreference')}
          layout="grid"
          value={cardioPref}
          onChange={setCardioPref}
          options={CARDIO_PREFERENCES.map((v) => ({
            value: v,
            label: t(`questionnaire.options.cardio.${v}`),
          }))}
          error={error(!cardioPref)}
        />
      )}
    </StepForm>
  )
}

/** Step 6 · Alimentação. Foods the user doesn't eat arrive with the food base (phase 10). */
export function DietStep(props: StepProps) {
  const { t } = useTranslation()
  const saved = props.questionnaire.diet
  const [restrictions, setRestrictions] = useState<DietRestriction[]>(saved.diet_restrictions ?? [])
  const [meals, setMeals] = useState<number | null>(saved.meals_per_day)
  const [split, setSplit] = useState<DietSplit | null>(saved.diet_split)
  const { missing, error } = useRequired()

  const build = () => {
    if (!meals || !split) return missing()
    return {
      diet_restrictions: DIET_RESTRICTIONS.filter((r) => restrictions.includes(r)),
      meals_per_day: meals,
      diet_split: split,
    }
  }

  return (
    <StepForm section="diet" build={build} {...props}>
      <MultiChoice<DietRestriction>
        label={t('questionnaire.diet.restrictions')}
        hint={t('questionnaire.diet.restrictionsHint')}
        values={restrictions}
        onChange={setRestrictions}
        layout="grid"
        options={DIET_RESTRICTIONS.map((v) => ({
          value: v,
          label: t(`questionnaire.options.restriction.${v}`),
        }))}
      />
      <ComingSoonNote
        title={t('questionnaire.diet.foodsSoon')}
        text={t('questionnaire.diet.foodsSoonText')}
      />
      <ChoiceGroup<number>
        label={t('questionnaire.diet.meals')}
        hint={t('questionnaire.diet.mealsHint')}
        layout="row"
        value={meals}
        onChange={setMeals}
        options={MEALS_PER_DAY.map((v) => ({ value: v, label: String(v) }))}
        error={error(!meals)}
      />
      <ChoiceGroup<DietSplit>
        label={t('questionnaire.diet.split')}
        value={split}
        onChange={setSplit}
        options={DIET_SPLITS.map((v) => ({
          value: v,
          label: t(`questionnaire.options.split.${v}`),
          description: t(`questionnaire.options.splitHint.${v}`),
        }))}
        error={error(!split)}
      />
    </StepForm>
  )
}
