import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { Logo } from '../../components/brand/Logo'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { ROUTES } from '../../routes'

export type LegalDoc = 'terms' | 'privacy' | 'cookies'

/** body paragraphs → bullet items → closing note, each optional. */
type Section = { title: string; body?: string[]; items?: string[]; note?: string }

const DOC_ROUTES: Record<LegalDoc, string> = {
  terms: ROUTES.terms,
  privacy: ROUTES.privacy,
  cookies: ROUTES.cookies,
}

/** Terms, Privacy and Cookies (texts in locales/pt-BR.json → legalDocs). */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Filled into the texts wherever they name the controller or the contact e-mail.
  const vars = {
    owner: t('legal.owner.name'),
    location: t('legal.owner.location'),
    email: t('contact.email'),
  }
  const title = t(`legalDocs.${doc}.title`)
  const sections = t(`legalDocs.${doc}.sections`, { returnObjects: true, ...vars }) as Section[]

  useEffect(() => {
    document.title = `${title} · ${t('app.name')}`
  }, [title, t])

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate(ROUTES.home)
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-8">
      <header className="flex items-center justify-between">
        <Link to={ROUTES.home} className="rounded-lg" aria-label={t('auth.backHome')}>
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto grid w-full max-w-2xl gap-8 py-10">
        <button
          type="button"
          onClick={goBack}
          className="text-muted hover:text-text flex h-11 w-fit items-center gap-2 font-semibold"
        >
          <ArrowLeft className="size-5" aria-hidden />
          {t('legal.back')}
        </button>

        <div className="grid gap-3">
          <h1 className="text-5xl leading-none font-extrabold uppercase italic">{title}</h1>
          <p className="text-muted text-sm">
            {t('legal.version', {
              version: t(`legalDocs.${doc}.version`),
              date: t(`legalDocs.${doc}.date`),
            })}
          </p>
          <p className="text-lg">{t(`legalDocs.${doc}.intro`)}</p>
        </div>

        {sections.map((section) => (
          <section key={section.title} className="grid gap-3">
            <h2 className="text-xl font-bold">{section.title}</h2>
            {section.body?.map((p) => (
              <p key={p} className="text-muted leading-relaxed">
                {p}
              </p>
            ))}
            {section.items && (
              <ul className="text-muted grid list-disc gap-2 pl-5 leading-relaxed">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.note && <p className="text-muted leading-relaxed">{section.note}</p>}
          </section>
        ))}

        <p className="text-muted border-border border-t pt-6 text-sm">
          {t('legal.reviewNote', { email: vars.email })}
        </p>

        <nav aria-label={t('legal.otherDocs')} className="grid gap-2">
          <span className="text-muted text-xs font-semibold tracking-wider uppercase">
            {t('legal.otherDocs')}
          </span>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {(Object.keys(DOC_ROUTES) as LegalDoc[])
              .filter((d) => d !== doc)
              .map((d) => (
                <li key={d}>
                  <Link to={DOC_ROUTES[d]} className="font-semibold underline underline-offset-2">
                    {t(`legalDocs.${d}.title`)}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </main>
    </div>
  )
}
