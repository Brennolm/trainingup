import { Check } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Logo } from '../components/brand/Logo'
import { NAV_ITEMS } from '../components/navigation/navItems'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { ChoiceGroup, MultiChoice } from '../components/ui/ChoiceGroup'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Pagination } from '../components/ui/Pagination'
import { Select } from '../components/ui/Select'
import { Tabs } from '../components/ui/Tabs'
import { Textarea } from '../components/ui/Textarea'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useToast } from '../components/ui/toastContext'
import { MUSCLES } from '../features/workout/exerciseOptions'
import { AppShell } from '../layouts/AppShell'

// Internal page to review the design system in both themes. Not linked from the product.
const DEMO_NAV = NAV_ITEMS.map((item) => ({ ...item, to: `/design${item.to}` }))

const SWATCHES = [
  'bg',
  'surface',
  'surface-2',
  'border',
  'text',
  'muted',
  'primary',
  'secondary',
  'success',
  'warning',
  'danger',
] as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-muted text-sm font-semibold tracking-[0.08em] uppercase">{title}</h2>
      {children}
    </section>
  )
}

export function DesignSystemPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [page, setPage] = useState(2)
  const [goal, setGoal] = useState<string | null>('lose_fat')
  const [days, setDays] = useState<string[]>(['mon', 'wed', 'fri'])
  const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

  return (
    <AppShell items={DEMO_NAV}>
      <div className="mx-auto grid max-w-3xl gap-10">
        <header className="flex items-start justify-between gap-4">
          <div className="grid gap-2">
            <div className="md:hidden">
              <Logo />
            </div>
            <h1 className="text-4xl font-extrabold uppercase italic">{t('design.title')}</h1>
            <p className="text-muted">{t('design.intro')}</p>
          </div>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </header>

        <Section title={t('design.colors')}>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {SWATCHES.map((name) => (
              <div key={name} className="grid gap-1.5">
                <span
                  className="ring-border h-12 rounded-xl ring-1 ring-inset"
                  style={{ background: `var(--${name})` }}
                />
                <span className="text-muted text-xs">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t('design.typography')}>
          <Card className="grid gap-2">
            <span className="font-display text-5xl font-extrabold uppercase italic">
              {t('design.sample.headingSample')}
            </span>
            <span className="font-display text-2xl font-semibold uppercase">
              {t('design.sample.exercise')}
            </span>
            <p className="text-muted max-w-[60ch]">{t('design.sample.bodySample')}</p>
          </Card>
        </Section>

        <Section title={t('design.buttons')}>
          <div className="flex flex-wrap gap-3">
            <Button>{t('design.sample.start')}</Button>
            <Button variant="secondary">{t('design.sample.secondary')}</Button>
            <Button variant="ghost">{t('design.sample.ghost')}</Button>
            <Button variant="danger">{t('design.sample.danger')}</Button>
            <Button loading>{t('common.loading')}</Button>
          </div>
          <Button size="lg" fullWidth>
            {t('design.sample.start')}
          </Button>
        </Section>

        <Section title={t('design.inputs')}>
          <Card className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('design.sample.loadLabel')}
              inputMode="decimal"
              defaultValue={nf.format(60)}
              suffix="kg"
              hint={t('design.sample.loadHint')}
            />
            <Input label={t('design.sample.repsLabel')} inputMode="numeric" defaultValue="10" />
            <Input
              label={t('design.sample.emailLabel')}
              type="email"
              defaultValue="nome@"
              error={t('design.sample.emailError')}
            />
            <Input label={t('design.sample.passwordLabel')} type="password" defaultValue="segredo123" />
            <Select
              label={t('workout.library.muscle')}
              defaultValue="chest"
              options={MUSCLES.map((m) => ({ value: m, label: t(`exercise.muscles.${m}`) }))}
            />
            <Textarea
              label={t('design.sample.noteLabel')}
              defaultValue={t('design.sample.noteValue')}
              className="sm:col-span-2"
            />
          </Card>
        </Section>

        <Section title={t('design.choices')}>
          <Card className="grid gap-6">
            <ChoiceGroup<string>
              label={t('questionnaire.goal.goal')}
              value={goal}
              onChange={setGoal}
              options={['lose_fat', 'maintain', 'gain_muscle'].map((v) => ({
                value: v,
                label: t(`questionnaire.options.goal.${v}`),
              }))}
            />
            <ChoiceGroup<boolean>
              label={t('questionnaire.training.cardio')}
              layout="row"
              value={null}
              onChange={() => undefined}
              error={t('questionnaire.required')}
              options={[
                { value: true, label: t('questionnaire.yes') },
                { value: false, label: t('questionnaire.no') },
              ]}
            />
            <MultiChoice<string>
              label={t('questionnaire.training.days')}
              values={days}
              onChange={setDays}
              options={['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((v) => ({
                value: v,
                label: t(`questionnaire.options.weekday.${v}`),
              }))}
            />
          </Card>
        </Section>

        <Section title={t('design.cards')}>
          <Card className="grid gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <CardTitle>{t('design.sample.exercise')}</CardTitle>
              <span className="text-muted text-sm">{t('design.sample.setInfo')}</span>
            </div>
            <p className="text-muted text-sm">
              {t('design.sample.lastTime', { load: `${nf.format(57.5)} kg`, reps: 10 })}
            </p>
            <div className="bg-surface-2 flex items-center justify-between gap-3 rounded-xl p-3">
              <span className="text-xl font-semibold tabular-nums">{nf.format(60)} kg × 10</span>
              <button
                type="button"
                onClick={() => setDone((d) => !d)}
                aria-pressed={done}
                aria-label={t('design.sample.toastTitle')}
                className={
                  done
                    ? 'bg-primary text-on-primary grid size-12 place-items-center rounded-xl transition-transform active:scale-95'
                    : 'bg-surface text-muted ring-border grid size-12 place-items-center rounded-xl ring-1 transition-transform ring-inset active:scale-95'
                }
              >
                <Check className="size-6" strokeWidth={3} aria-hidden />
              </button>
            </div>
          </Card>
        </Section>

        <Section title={t('design.tabs')}>
          <Tabs
            items={[
              {
                value: 'plan',
                label: t('design.sample.tabPlan'),
                content: <Card>{t('design.sample.tabPlanBody')}</Card>,
              },
              {
                value: 'history',
                label: t('design.sample.tabHistory'),
                content: <Card>{t('design.sample.tabHistoryBody')}</Card>,
              },
              {
                value: 'library',
                label: t('design.sample.tabLibrary'),
                content: <Card>{t('design.sample.tabLibraryBody')}</Card>,
              },
            ]}
          />
        </Section>

        <Section title={t('design.pagination')}>
          <Pagination page={page} last={5} onChange={setPage} />
        </Section>

        <Section title={t('design.feedback')}>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              {t('design.sample.openModal')}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast({ title: t('design.sample.toastTitle'), description: t('design.sample.toastBody') })
              }
            >
              {t('design.sample.showToast')}
            </Button>
          </div>
        </Section>

        <Section title={t('design.navigation')}>
          <p className="text-muted">
            {t('nav.main')}: {NAV_ITEMS.map((i) => t(i.labelKey)).join(' · ')}
          </p>
        </Section>
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={t('design.sample.modalTitle')}
        description={t('design.sample.modalBody')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => setModalOpen(false)}>{t('design.sample.modalConfirm')}</Button>
          </>
        }
      />
    </AppShell>
  )
}
