import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChoiceGroup } from '../../../components/ui/ChoiceGroup'
import { Input } from '../../../components/ui/Input'
import { SegmentedControl } from '../../../components/ui/SegmentedControl'
import { useToast } from '../../../components/ui/toastContext'
import { cmToFtIn, ftInToCm, kgToLb, lbToKg, parseDecimal, toDecimalInput } from '../../../lib/units'
import { authApi } from '../../auth/authApi'
import { errorMessage } from '../../auth/errors'
import type { LengthUnit, WeightUnit } from '../../auth/types'
import { useMe, useSetMe } from '../../auth/useAuth'
import { HEIGHT_CM, SEXES, WEIGHT_KG } from '../options'
import { StepForm, type StepProps } from '../StepForm'
import type { Sex } from '../types'

const show = (n: number, digits = 1) => toDecimalInput(n, digits)

/** Step 1 · Sobre você: biological sex, height and weight, in the user's units (stored metric). */
export function PersonalStep(props: StepProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const { data: user } = useMe()
  const setMe = useSetMe()
  const saved = props.questionnaire.personal
  const weightUnit: WeightUnit = user?.preferences.weight_unit ?? 'kg'
  const lengthUnit: LengthUnit = user?.preferences.length_unit ?? 'cm'

  const [sex, setSex] = useState<Sex | null>(saved.sex)
  const [weight, setWeight] = useState(() =>
    saved.weight_kg === null ? '' : show(weightUnit === 'lb' ? kgToLb(saved.weight_kg) : saved.weight_kg),
  )
  const [heightCm, setHeightCm] = useState(() => (saved.height_cm === null ? '' : show(saved.height_cm)))
  const initialFtIn = saved.height_cm === null ? null : cmToFtIn(saved.height_cm)
  const [feet, setFeet] = useState(initialFtIn ? String(initialFtIn.ft) : '')
  const [inches, setInches] = useState(initialFtIn ? String(initialFtIn.in) : '')
  const [showErrors, setShowErrors] = useState(false)

  const weightKg = (() => {
    const v = parseDecimal(weight)
    return v === null ? null : weightUnit === 'lb' ? lbToKg(v) : v
  })()
  const height = (() => {
    if (lengthUnit === 'cm') return parseDecimal(heightCm)
    const ft = parseDecimal(feet)
    const inch = parseDecimal(inches) ?? 0
    return ft === null ? null : ftInToCm(ft, inch)
  })()

  const weightOk = weightKg !== null && weightKg >= WEIGHT_KG.min && weightKg <= WEIGHT_KG.max
  const heightOk = height !== null && height >= HEIGHT_CM.min && height <= HEIGHT_CM.max

  const changeUnits = async (prefs: { weight_unit?: WeightUnit; length_unit?: LengthUnit }) => {
    if (!user) return
    // Convert what was typed so the value stays the same.
    if (prefs.weight_unit && weightKg !== null) {
      setWeight(show(prefs.weight_unit === 'lb' ? kgToLb(weightKg) : weightKg))
    }
    if (prefs.length_unit && height !== null) {
      const { ft, in: inch } = cmToFtIn(height)
      setFeet(String(ft))
      setInches(String(inch))
      setHeightCm(show(height))
    }
    const previous = user
    setMe({ ...user, preferences: { ...user.preferences, ...prefs } })
    try {
      setMe(await authApi.updatePreferences(prefs))
    } catch (error) {
      setMe(previous)
      toast({ title: errorMessage(error, t), tone: 'error' })
    }
  }

  const build = () => {
    if (!sex || !weightOk || !heightOk) {
      setShowErrors(true)
      return null
    }
    return { sex, height_cm: Math.round(height * 10) / 10, weight_kg: Math.round(weightKg * 100) / 100 }
  }

  const range = (min: number, max: number, unit: string, toUnit: (n: number) => number) =>
    t('questionnaire.personal.range', { min: show(toUnit(min), 0), max: show(toUnit(max), 0), unit })

  const weightError =
    showErrors && !weightOk
      ? weightUnit === 'lb'
        ? range(WEIGHT_KG.min, WEIGHT_KG.max, 'lb', kgToLb)
        : range(WEIGHT_KG.min, WEIGHT_KG.max, 'kg', (n) => n)
      : undefined
  const heightError =
    showErrors && !heightOk
      ? lengthUnit === 'cm'
        ? range(HEIGHT_CM.min, HEIGHT_CM.max, 'cm', (n) => n)
        : t('questionnaire.personal.rangeFtIn')
      : undefined

  return (
    <StepForm section="personal" build={build} {...props}>
      <ChoiceGroup<Sex>
        label={t('questionnaire.personal.sex')}
        hint={t('questionnaire.personal.sexHint')}
        layout="row"
        value={sex}
        onChange={setSex}
        options={SEXES.map((v) => ({ value: v, label: t(`questionnaire.options.sex.${v}`) }))}
        error={showErrors && !sex ? t('questionnaire.required') : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SegmentedControl<WeightUnit>
          label={t('profile.preferences.weight')}
          value={weightUnit}
          onChange={(weight_unit) => changeUnits({ weight_unit })}
          options={[
            { value: 'kg', label: t('profile.preferences.kg') },
            { value: 'lb', label: t('profile.preferences.lb') },
          ]}
        />
        <SegmentedControl<LengthUnit>
          label={t('profile.preferences.length')}
          value={lengthUnit}
          onChange={(length_unit) => changeUnits({ length_unit })}
          options={[
            { value: 'cm', label: t('profile.preferences.cm') },
            { value: 'ft_in', label: t('profile.preferences.ftIn') },
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {lengthUnit === 'cm' ? (
          <Input
            label={t('questionnaire.personal.height')}
            inputMode="decimal"
            suffix="cm"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            error={heightError}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Input
              label={t('questionnaire.personal.heightFt')}
              inputMode="numeric"
              suffix="ft"
              value={feet}
              onChange={(e) => setFeet(e.target.value)}
              error={heightError}
            />
            <Input
              label={t('questionnaire.personal.heightIn')}
              inputMode="numeric"
              suffix="in"
              value={inches}
              onChange={(e) => setInches(e.target.value)}
            />
          </div>
        )}
        <Input
          label={t('questionnaire.personal.weight')}
          inputMode="decimal"
          suffix={weightUnit}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          error={weightError}
        />
      </div>
    </StepForm>
  )
}
