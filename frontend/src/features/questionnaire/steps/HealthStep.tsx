import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChoiceGroup, MultiChoice } from '../../../components/ui/ChoiceGroup'
import { HEALTH_CONDITIONS, PAR_Q_QUESTIONS } from '../options'
import { StepForm, type StepProps } from '../StepForm'
import type { HealthAnswers, HealthCondition } from '../types'

const NONE = 'none'
type ConditionChoice = HealthCondition | typeof NONE

function sameAnswers(a: HealthAnswers, b: HealthAnswers) {
  return (
    a.par_q.every((v, i) => v === b.par_q[i]) &&
    a.pregnant_or_lactating === b.pregnant_or_lactating &&
    [...a.conditions].sort().join() === [...b.conditions].sort().join()
  )
}

/** Step 2 · Saúde: PAR-Q, pregnancy/breastfeeding (women) and clinical conditions (SPEC 5.1). */
export function HealthStep(props: StepProps) {
  const { t } = useTranslation()
  const saved = props.questionnaire.health
  const female = props.questionnaire.personal.sex === 'female'

  const [parQ, setParQ] = useState<(boolean | null)[]>(
    () => saved?.par_q ?? Array<null>(PAR_Q_QUESTIONS).fill(null),
  )
  const [pregnant, setPregnant] = useState<boolean | null>(saved?.pregnant_or_lactating ?? null)
  // null = not answered; [] = "none of these".
  const [conditions, setConditions] = useState<HealthCondition[] | null>(saved?.conditions ?? null)
  const [showErrors, setShowErrors] = useState(false)

  const complete = parQ.every((a) => a !== null) && (!female || pregnant !== null) && conditions !== null
  const current: HealthAnswers | null = complete
    ? { par_q: parQ as boolean[], pregnant_or_lactating: female ? pregnant : null, conditions: conditions }
    : null
  const changing = saved !== null && current !== null && !sameAnswers(saved, current)

  const yesNo = [
    { value: true, label: t('questionnaire.yes') },
    { value: false, label: t('questionnaire.no') },
  ]
  const required = (missing: boolean) => (showErrors && missing ? t('questionnaire.required') : undefined)

  const conditionValues: ConditionChoice[] =
    conditions === null ? [] : conditions.length ? conditions : [NONE]
  const changeConditions = (values: ConditionChoice[]) => {
    // "Nenhuma" and the conditions exclude each other: keep the one just tapped.
    const tappedNone = values.includes(NONE) && !conditionValues.includes(NONE)
    if (tappedNone) return setConditions([])
    const list = values.filter((v): v is HealthCondition => v !== NONE)
    setConditions(list.length || values.includes(NONE) ? list : null)
  }

  const build = () => {
    if (!current) {
      setShowErrors(true)
      return null
    }
    return { ...current }
  }

  return (
    <StepForm section="health" build={build} confirmRequired={changing} {...props}>
      <div className="grid gap-1">
        <h3 className="font-display text-lg font-semibold tracking-wide uppercase">
          {t('questionnaire.health.parQTitle')}
        </h3>
        <p className="text-muted text-sm">{t('questionnaire.health.parQIntro')}</p>
      </div>
      <ol className="grid gap-6">
        {parQ.map((answer, i) => (
          <li key={i}>
            <ChoiceGroup<boolean>
              label={`${i + 1}. ${t(`questionnaire.health.parQ.${i}`)}`}
              layout="row"
              value={answer}
              onChange={(v) => setParQ((all) => all.map((a, j) => (j === i ? v : a)))}
              options={yesNo}
              error={required(answer === null)}
            />
          </li>
        ))}
      </ol>

      {female && (
        <ChoiceGroup<boolean>
          label={t('questionnaire.health.pregnant')}
          layout="row"
          value={pregnant}
          onChange={setPregnant}
          options={yesNo}
          error={required(pregnant === null)}
        />
      )}

      <MultiChoice<ConditionChoice>
        label={t('questionnaire.health.conditions')}
        hint={t('questionnaire.health.conditionsHint')}
        layout="stack"
        values={conditionValues}
        onChange={changeConditions}
        options={[
          ...HEALTH_CONDITIONS.map((c) => ({ value: c, label: t(`questionnaire.options.conditions.${c}`) })),
          { value: NONE, label: t('questionnaire.health.none') },
        ]}
        error={required(conditions === null)}
      />
    </StepForm>
  )
}
