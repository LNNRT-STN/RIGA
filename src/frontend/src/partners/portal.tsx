import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleX,
  Copy,
  Headphones,
  Landmark,
  LoaderCircle,
  Plus,
  ShieldCheck,
  ShieldQuestion,
  ShieldX,
  Smartphone,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { askKate } from '@/kbc/demo'
import { KbcWordmark } from '@/kbc/ui'
import {
  applyAsPartner,
  demoCompanies,
  getDirectory,
  getDnsRecords,
  lookupCompany,
  PartnerApiError,
  verifySteps,
  type Application,
  type ApplyResult,
  type Company,
  type Directory,
  type DnsRecord,
  type OnboardingCheck,
} from './api'

type Step = 'intro' | 'company' | 'profile' | 'proof' | 'connect' | 'result'
type FieldErrors = PartnerApiError['fields']

const steps: { id: Step; label: string }[] = [
  { id: 'company', label: 'Your company' },
  { id: 'profile', label: 'Your profile' },
  { id: 'proof', label: 'Prove what’s yours' },
  { id: 'connect', label: 'Go live' },
]

const fieldStep: Record<keyof Application, Step> = {
  enterpriseNumber: 'company',
  brandName: 'profile',
  website: 'profile',
  phone: 'profile',
  category: 'profile',
  domains: 'proof',
  ibans: 'proof',
  modules: 'connect',
}

const categoryLabels: Record<string, string> = {
  telecom: 'Telecom',
  energy: 'Energy',
  travel: 'Travel',
  retail: 'Retail',
  insurance: 'Insurance',
  supplier: 'Business supplier',
  'packaging supplier': 'Supplier',
  other: 'Other',
}

const defaultModules = ['invoices', 'websites', 'calls']

const emptyApplication: Application = {
  enterpriseNumber: '',
  brandName: '',
  website: '',
  phone: '',
  category: 'other',
  domains: [],
  ibans: [],
  modules: [],
}

/**
 * "KBC Trust for partners": a company signs up to become Verified by KBC. Shown next to the phone in
 * the demo, so the audience sees the customer's Kate answer change the moment the company goes live.
 */
export function PartnerPortal({ onClose }: { onClose: () => void }) {
  const [directory, setDirectory] = useState<Directory | null>(null)
  const [step, setStep] = useState<Step>('intro')
  const [form, setForm] = useState<Application>(emptyApplication)
  const [company, setCompany] = useState<Company | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ApplyResult | null>(null)

  const refreshDirectory = () =>
    getDirectory()
      .then(setDirectory)
      .catch(() => undefined)

  useEffect(() => {
    void refreshDirectory()
  }, [])

  const availableModules = directory?.modules.filter((m) => m.status === 'available').map((m) => m.id) ?? defaultModules
  const update = (patch: Partial<Application>) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(patch) as (keyof Application)[]) delete next[key]
      return next
    })
  }

  const lookup = async (enterpriseNumber: string, preset?: Partial<Application>) => {
    setBusy(true)
    setNotice(null)
    setErrors({})
    setCompany(null)
    try {
      const found = await lookupCompany(enterpriseNumber)
      setCompany(found.company)
      setForm({
        ...emptyApplication,
        enterpriseNumber: found.company.enterpriseNumber,
        modules: availableModules,
        ...(found.suggested ?? {}),
        ...(preset ?? {}),
      })
    } catch (error) {
      if (error instanceof PartnerApiError && error.fields.enterpriseNumber) setErrors(error.fields)
      else setNotice(error instanceof Error ? error.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const fillDemo = (which: keyof typeof demoCompanies) => {
    const preset = demoCompanies[which]
    setResult(null)
    setStep('company')
    setForm({ ...emptyApplication, enterpriseNumber: preset.enterpriseNumber })
    void lookup(preset.enterpriseNumber, 'application' in preset ? { ...preset.application, domains: [...preset.application.domains], ibans: [...preset.application.ibans] } : undefined)
  }

  const submit = async () => {
    setBusy(true)
    setNotice(null)
    setStep('result')
    setResult(null)
    try {
      const outcome = await applyAsPartner(form)
      setResult(outcome)
      if (outcome.decision === 'approved') void refreshDirectory()
    } catch (error) {
      if (error instanceof PartnerApiError && Object.keys(error.fields).length > 0) {
        setErrors(error.fields)
        const first = Object.keys(error.fields)[0] as keyof Application
        setStep(fieldStep[first] ?? 'connect')
      } else {
        setStep('connect')
      }
      setNotice(error instanceof Error ? error.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const startOver = () => {
    setStep('intro')
    setForm(emptyApplication)
    setCompany(null)
    setErrors({})
    setNotice(null)
    setResult(null)
  }

  const currentIndex = steps.findIndex((s) => s.id === step)
  const reached = step === 'result' ? steps.length : currentIndex

  return (
    <section aria-label="KBC Trust for partners" className="kbc flex h-full flex-col overflow-hidden rounded-[16px] bg-white text-kbc-navy shadow-[0_12px_32px_rgba(0,59,113,0.14)]">
      <header className="flex h-[64px] shrink-0 items-center gap-4 border-b border-kbc-line px-6">
        <p className="flex items-baseline gap-2 text-[17px] font-bold whitespace-nowrap">
          <KbcWordmark className="text-[20px]" />
          <span>Trust for partners</span>
        </p>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <DemoMenu onFill={fillDemo} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the partner portal"
            className="grid size-[44px] place-items-center rounded-full text-kbc-link transition-colors duration-150 hover:bg-kbc-pale"
          >
            <X className="size-[22px]" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="no-scrollbar hidden w-[256px] shrink-0 flex-col gap-8 overflow-y-auto border-r border-kbc-line bg-kbc-pale px-5 py-7 md:flex">
          <nav aria-label="Sign-up steps">
            <ol className="flex flex-col gap-1">
              {steps.map((s, i) => {
                const done = i < reached
                const current = s.id === step
                const canGo = done && step !== 'result'
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={!canGo}
                      onClick={() => setStep(s.id)}
                      aria-current={current ? 'step' : undefined}
                      className={cn(
                        'flex min-h-[44px] w-full items-center gap-3 rounded-[8px] px-2 text-left text-[15px] transition-colors duration-150',
                        canGo && 'hover:bg-white',
                        current ? 'font-bold text-kbc-navy' : done ? 'text-kbc-navy' : 'text-kbc-muted',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-[26px] shrink-0 place-items-center rounded-full text-[13px] font-bold tabular-nums',
                          done && 'bg-kbc-green text-white',
                          current && 'bg-kbc-blue text-white',
                          !done && !current && 'border-[1.5px] border-kbc-control text-kbc-muted',
                        )}
                      >
                        {done ? <Check className="size-[15px]" strokeWidth={3} /> : i + 1}
                      </span>
                      {s.label}
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>
          <Network directory={directory} />
        </aside>

        <main className="@container no-scrollbar min-w-0 flex-1 overflow-y-auto px-6 py-8 md:px-10">
          {notice && (
            <p role="alert" className="mb-6 flex max-w-[560px] items-start gap-2 rounded-[8px] bg-kbc-danger-bg px-4 py-3 text-[15px] text-kbc-danger">
              <CircleAlert className="mt-[2px] size-[18px] shrink-0" strokeWidth={2} />
              {notice}
            </p>
          )}
          {step === 'intro' && <Intro onStart={() => setStep('company')} />}
          {step === 'company' && (
            <CompanyStep
              number={form.enterpriseNumber}
              onNumber={(enterpriseNumber) => update({ enterpriseNumber })}
              onLookup={() => void lookup(form.enterpriseNumber)}
              company={company}
              busy={busy}
              error={errors.enterpriseNumber}
              onNext={() => setStep('profile')}
            />
          )}
          {step === 'profile' && <ProfileStep form={form} errors={errors} update={update} categories={directory?.categories} onNext={() => setStep('proof')} />}
          {step === 'proof' && <ProofStep form={form} errors={errors} update={update} onNext={() => setStep('connect')} />}
          {step === 'connect' && (
            <ConnectStep form={form} errors={errors} update={update} modules={directory?.modules ?? []} busy={busy} onSubmit={() => void submit()} />
          )}
          {step === 'result' &&
            (result ? (
              <ResultView result={result} form={form} onEdit={() => setStep('proof')} onStartOver={startOver} />
            ) : (
              <Verifying />
            ))}
        </main>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------------------------------------ */
/* Steps                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

function Intro({ onStart }: { onStart: () => void }) {
  const benefits: { icon: LucideIcon; title: string; detail: string }[] = [
    { icon: ShieldCheck, title: 'Fewer scams in your name', detail: 'Fake invoices, emails and websites that use your name are flagged before customers pay.' },
    { icon: Headphones, title: 'Fewer calls to your helpdesk', detail: 'Customers ask Kate “Is this real?” and get the answer in the KBC app.' },
    { icon: Landmark, title: 'Paid on the right account', detail: 'Kate confirms only the IBANs you verified, so payments don’t go astray.' },
  ]
  return (
    <div className="max-w-[600px] animate-in duration-300 fade-in motion-reduce:animate-none">
      <h1 className="text-[32px] leading-[1.2] font-extrabold tracking-[-0.02em] text-balance">Let every KBC customer know it’s really you</h1>
      <p className="mt-3 max-w-[60ch] text-[17px] leading-[1.5]">
        Scammers send invoices, emails and calls in your name. Once you’re Verified by KBC, Kate confirms the real ones to every KBC
        customer and warns them about the fakes.
      </p>
      <ul className="mt-8 divide-y divide-kbc-line border-y border-kbc-line">
        {benefits.map(({ icon: Icon, title, detail }) => (
          <li key={title} className="flex items-start gap-4 py-4">
            <Icon className="mt-[2px] size-[24px] shrink-0 text-kbc-blue" strokeWidth={1.6} />
            <span>
              <span className="block text-[16px] font-bold">{title}</span>
              <span className="block text-[15px] leading-[1.45] text-kbc-muted">{detail}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <PrimaryButton onClick={onStart}>
          Start sign-up <ArrowRight className="size-[18px]" strokeWidth={2} />
        </PrimaryButton>
        <p className="text-[14px] text-kbc-muted">KBC business customers: most details are filled in for you.</p>
      </div>
    </div>
  )
}

function CompanyStep({
  number,
  onNumber,
  onLookup,
  company,
  busy,
  error,
  onNext,
}: {
  number: string
  onNumber: (value: string) => void
  onLookup: () => void
  company: Company | null
  busy: boolean
  error?: string
  onNext: () => void
}) {
  const inputId = useId()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!busy) onLookup()
  }
  return (
    <StepFrame title="Your company" intro="We read your details from the Crossroads Bank for Enterprises, so you don’t type them.">
      <form onSubmit={submit} className="max-w-[560px]">
        <label htmlFor={inputId} className="mb-2 block text-[15px] font-bold">
          Enterprise number
        </label>
        <div className="flex gap-3">
          <TextInput id={inputId} value={number} onChange={onNumber} placeholder="0764.312.290" invalid={Boolean(error)} inputMode="numeric" autoComplete="off" />
          <SecondaryButton type="submit" disabled={busy || !number.trim()}>
            {busy ? <LoaderCircle className="size-[18px] animate-spin" strokeWidth={2} /> : null}
            {busy ? 'Looking up' : 'Look up'}
          </SecondaryButton>
        </div>
        <FieldError message={error} />
      </form>

      {company && (
        <div className="mt-6 max-w-[560px] animate-in duration-300 fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
          <dl className="divide-y divide-kbc-line rounded-[12px] border border-kbc-line px-4">
            <Row label="Legal name" value={company.legalName} strong />
            <Row label="Enterprise number" value={company.enterpriseNumber} />
            <Row label="Legal form" value={company.legalForm} />
            <Row label="Address" value={company.address} />
            <Row label="Activity" value={company.activity} />
            <Row label="Founded" value={company.founded} />
          </dl>
          {company.kbcCustomerSince ? (
            <InlineNote tone="success" icon={CircleCheck}>
              KBC business customer since {company.kbcCustomerSince}. We already know who runs your company.
            </InlineNote>
          ) : (
            <InlineNote tone="neutral" icon={ShieldQuestion}>
              You don’t bank with KBC yet. A KBC analyst confirms who runs your company before you go live.
            </InlineNote>
          )}
          <StepActions>
            <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
          </StepActions>
        </div>
      )}
    </StepFrame>
  )
}

function ProfileStep({
  form,
  errors,
  update,
  categories,
  onNext,
}: {
  form: Application
  errors: FieldErrors
  update: (patch: Partial<Application>) => void
  categories?: string[]
  onNext: () => void
}) {
  return (
    <StepFrame title="How customers see you" intro="Kate shows these details when a customer asks “Is this real?”.">
      <div className="grid gap-8 @[760px]:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-5">
          <Field label="Name customers know you by" error={errors.brandName}>
            {(id) => <TextInput id={id} value={form.brandName} onChange={(brandName) => update({ brandName })} invalid={Boolean(errors.brandName)} />}
          </Field>
          <Field label="Website" error={errors.website}>
            {(id) => <TextInput id={id} value={form.website} onChange={(website) => update({ website })} invalid={Boolean(errors.website)} placeholder="yourcompany.be" />}
          </Field>
          <Field label="Customer service number" hint="Kate tells customers to call this number when something looks wrong." error={errors.phone}>
            {(id) => <TextInput id={id} value={form.phone} onChange={(phone) => update({ phone })} invalid={Boolean(errors.phone)} inputMode="tel" />}
          </Field>
          <Field label="Sector">
            {(id) => (
              <div className="relative">
                <select
                  id={id}
                  value={form.category}
                  onChange={(e) => update({ category: e.target.value })}
                  className="h-[48px] w-full appearance-none rounded-[8px] border border-kbc-control bg-white pr-10 pl-3 text-[16px] text-kbc-navy"
                >
                  {(categories ?? Object.keys(categoryLabels)).map((c) => (
                    <option key={c} value={c}>
                      {categoryLabels[c] ?? c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-[18px] -translate-y-1/2 text-kbc-link" strokeWidth={2} />
              </div>
            )}
          </Field>
          <StepActions>
            <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
          </StepActions>
        </div>
        <KatePreview form={form} />
      </div>
    </StepFrame>
  )
}

/** Small preview of the answer customers get in Kate, built from what the partner types. */
function KatePreview({ form }: { form: Application }) {
  const name = form.brandName.trim() || 'Your company'
  const site = form.website.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '') || 'yourcompany.be'
  return (
    <figure className="order-first self-start @[760px]:order-none">
      <figcaption className="mb-2 text-[14px] font-bold text-kbc-muted">What customers see in Kate</figcaption>
      <div className="overflow-hidden rounded-[12px] shadow-[0_2px_10px_rgba(20,41,77,0.08)] ring-1 ring-kbc-green/25">
        <div className="flex items-center gap-2 bg-kbc-success-bg px-4 py-3 text-kbc-green">
          <ShieldCheck className="size-[22px]" strokeWidth={1.8} />
          <span className="text-[15px] font-bold">Verified by KBC</span>
        </div>
        <div className="bg-white px-4 pt-3 pb-4">
          <p className="text-[16px] leading-[1.3] font-extrabold break-words">This is the real {name} website</p>
          <p className="mt-1 text-[14px] leading-[1.4] break-words">{site} is a verified {name} domain, so you can continue.</p>
          <p className="mt-3 flex items-center gap-2 rounded-[24px] bg-kbc-blue px-4 py-[10px] text-[14px] leading-[1.3] font-semibold text-white">
            <Smartphone className="size-[16px] shrink-0" strokeWidth={1.8} />
            <span className="min-w-0 break-words tabular-nums">Call {name} · {form.phone.trim() || 'your number'}</span>
          </p>
        </div>
      </div>
    </figure>
  )
}

function ProofStep({
  form,
  errors,
  update,
  onNext,
}: {
  form: Application
  errors: FieldErrors
  update: (patch: Partial<Application>) => void
  onNext: () => void
}) {
  const [records, setRecords] = useState<DnsRecord[]>([])
  const [checking, setChecking] = useState(false)
  const domains = form.domains.join(',')

  const checkDns = () => {
    setChecking(true)
    getDnsRecords(form.enterpriseNumber, form.domains)
      .then((out) => setRecords(out.records))
      .catch(() => setRecords([]))
      .finally(() => setChecking(false))
  }

  useEffect(() => {
    checkDns()
    // Re-check when the list of domains changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domains, form.enterpriseNumber])

  return (
    <StepFrame title="Prove what’s yours" intro="Only what you prove here gets the Verified by KBC label. Anything else that uses your name gets a warning.">
      <div className="flex max-w-[620px] flex-col gap-8">
        <section>
          <h3 className="text-[18px] font-bold">Domains you send email from</h3>
          <p className="mt-1 mb-3 text-[15px] text-kbc-muted">Add this record to the DNS of each domain. It proves you control it.</p>
          <ListInput
            label="Domain"
            values={form.domains}
            onChange={(next) => update({ domains: next })}
            placeholder="yourcompany.be"
            error={errors.domains}
            render={(domain) => {
              const record = records.find((r) => r.domain === domain.toLowerCase())
              return <DnsRow domain={domain} record={record} checking={checking} />
            }}
          />
          {form.domains.length > 0 && (
            <button type="button" onClick={checkDns} disabled={checking} className="mt-2 min-h-[40px] text-[15px] font-bold text-kbc-link hover:underline disabled:text-kbc-muted">
              {checking ? 'Checking the DNS' : 'Check again'}
            </button>
          )}
        </section>

        <section>
          <h3 className="text-[18px] font-bold">Accounts customers pay you on</h3>
          <p className="mt-1 mb-3 text-[15px] text-kbc-muted">We check that each IBAN is held by your company. A payment to any other IBAN in your name gets a warning.</p>
          <ListInput
            label="IBAN"
            values={form.ibans}
            onChange={(next) => update({ ibans: next })}
            placeholder="BE00 0000 0000 0000"
            error={errors.ibans}
            render={(iban) => <span className="text-[16px] font-semibold tabular-nums">{iban}</span>}
          />
        </section>

        <StepActions>
          <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
        </StepActions>
      </div>
    </StepFrame>
  )
}

function DnsRow({ domain, record, checking }: { domain: string; record?: DnsRecord; checking: boolean }) {
  return (
    <span className="block min-w-0">
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[16px] font-semibold">{domain}</span>
        {record &&
          (record.found ? (
            <Status tone="success" icon={CircleCheck}>
              Record found
            </Status>
          ) : (
            <Status tone="warning" icon={CircleAlert}>
              {checking ? 'Checking' : 'Not found yet'}
            </Status>
          ))}
      </span>
      {record && (
        <span className="mt-2 flex items-center gap-2 rounded-[8px] bg-kbc-pale py-2 pr-2 pl-3 text-[13.5px]">
          <span className="min-w-0 flex-1">
            <span className="block text-kbc-muted">
              TXT record on <span className="font-mono text-kbc-navy">{record.host}</span>
            </span>
            <span className="block truncate font-mono text-kbc-navy">{record.value}</span>
          </span>
          <CopyButton text={record.value} label={`Copy the record for ${domain}`} />
        </span>
      )}
    </span>
  )
}

function ConnectStep({
  form,
  errors,
  update,
  modules,
  busy,
  onSubmit,
}: {
  form: Application
  errors: FieldErrors
  update: (patch: Partial<Application>) => void
  modules: Directory['modules']
  busy: boolean
  onSubmit: () => void
}) {
  const toggle = (id: string) =>
    update({ modules: form.modules.includes(id) ? form.modules.filter((m) => m !== id) : [...form.modules, id] })
  return (
    <StepFrame title="Choose what Kate confirms" intro="Switch on what fits your business. New kinds of scams become new modules, and you keep the same sign-up.">
      <fieldset className="max-w-[560px]">
        <legend className="sr-only">Modules</legend>
        <ul className="divide-y divide-kbc-line rounded-[12px] border border-kbc-line">
          {modules.map((m) => {
            const planned = m.status === 'planned'
            const on = form.modules.includes(m.id)
            return (
              <li key={m.id}>
                <label className={cn('flex min-h-[64px] items-start gap-3 px-4 py-3', planned ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-kbc-pale')}>
                  <input type="checkbox" className="peer sr-only" checked={on} disabled={planned} onChange={() => toggle(m.id)} />
                  <span
                    aria-hidden
                    className={cn(
                      'mt-[2px] grid size-[22px] shrink-0 place-items-center rounded-[6px] border-[1.5px] transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-kbc-link',
                      on ? 'border-kbc-blue bg-kbc-blue text-white' : 'border-kbc-control bg-white',
                      planned && 'border-kbc-line bg-kbc-pale',
                    )}
                  >
                    {on && <Check className="size-[15px]" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('flex items-center gap-2 text-[16px] font-bold', planned && 'text-kbc-muted')}>
                      {m.label}
                      {planned && <span className="rounded-full bg-kbc-pale px-2 py-[2px] text-[12.5px] font-bold text-kbc-muted">Planned</span>}
                    </span>
                    <span className="block text-[14.5px] leading-[1.4] text-kbc-muted">{m.detail}</span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
        <FieldError message={errors.modules} />
      </fieldset>
      <p className="mt-6 max-w-[560px] text-[15px] leading-[1.5] text-kbc-muted">
        We check your details against the enterprise register, KBC account data, the verified partners and scam reports from KBC
        customers. If something is unclear, a KBC analyst looks at it before you go live.
      </p>
      <StepActions>
        <PrimaryButton onClick={onSubmit} disabled={busy}>
          Verify and go live
        </PrimaryButton>
      </StepActions>
    </StepFrame>
  )
}

function Verifying() {
  const [done, setDone] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setDone((d) => Math.min(d + 1, verifySteps.length - 1)), 540)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <div role="status" className="max-w-[560px]">
      <h2 className="text-[26px] leading-[1.25] font-extrabold tracking-[-0.01em]">KBC is checking your company</h2>
      <ul className="mt-5 flex flex-col gap-1">
        {verifySteps.map((label, i) => (
          <li key={label} className={cn('flex min-h-[36px] items-center gap-3 text-[16px]', i <= done ? 'text-kbc-navy' : 'text-kbc-muted')}>
            {i < done ? (
              <CircleCheck className="size-[20px] text-kbc-green" strokeWidth={1.8} />
            ) : i === done ? (
              <LoaderCircle className="size-[20px] animate-spin text-kbc-blue" strokeWidth={2} />
            ) : (
              <span className="size-[20px]" />
            )}
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}

const decisionStyles: Record<ApplyResult['decision'], { icon: LucideIcon; label: string; band: string; text: string }> = {
  approved: { icon: ShieldCheck, label: 'Verified by KBC', band: 'bg-kbc-success-bg', text: 'text-kbc-green' },
  review: { icon: ShieldQuestion, label: 'Checked by a person', band: 'bg-kbc-surface-blue', text: 'text-kbc-link' },
  rejected: { icon: ShieldX, label: 'Not verified', band: 'bg-kbc-danger-bg', text: 'text-kbc-danger' },
}

function ResultView({ result, form, onEdit, onStartOver }: { result: ApplyResult; form: Application; onEdit: () => void; onStartOver: () => void }) {
  const style = decisionStyles[result.decision]
  const Icon = style.icon
  const open = result.checks.filter((c) => c.status !== 'pass')
  const website = result.partner?.website ?? form.website
  return (
    <div className="max-w-[600px] animate-in duration-300 fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <div className={cn('flex items-center gap-3 rounded-t-[12px] px-5 py-4', style.band, style.text)}>
        <Icon className="size-[30px] shrink-0" strokeWidth={1.7} />
        <p className="text-[17px] font-bold">{style.label}</p>
        {result.decision === 'approved' && (
          <p className="ml-auto text-[14px] font-semibold tabular-nums">{result.partnerCount} verified partners</p>
        )}
      </div>
      <div className="rounded-b-[12px] border border-t-0 border-kbc-line px-5 pt-4 pb-5">
        <h2 className="text-[24px] leading-[1.25] font-extrabold tracking-[-0.01em]">{result.headline}</h2>
        <p className="mt-2 text-[16px] leading-[1.5]">{result.summary}</p>

        {open.length > 0 && <CheckList checks={open} className="mt-4" />}

        <div className="mt-5 flex flex-wrap gap-3">
          {result.decision === 'approved' && (
            <PrimaryButton onClick={() => askKate(`Is ${website} real?`)}>
              <Smartphone className="size-[18px]" strokeWidth={1.8} />
              Show it in the KBC app
            </PrimaryButton>
          )}
          {result.decision === 'review' && <PrimaryButton onClick={onEdit}>Change details</PrimaryButton>}
          <SecondaryButton onClick={onStartOver}>{result.decision === 'approved' ? 'Sign up another company' : 'Start over'}</SecondaryButton>
        </div>

        {result.decision === 'approved' && <AllChecks checks={result.checks} />}
      </div>

      {result.decision === 'approved' && result.apiKey && <ApiPanel apiKey={result.apiKey} website={website} />}
    </div>
  )
}

function AllChecks({ checks }: { checks: OnboardingCheck[] }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="mt-4 -ml-1 flex min-h-[40px] items-center gap-1 px-1 text-[15px] font-bold text-kbc-link"
      >
        {open ? 'Hide checks' : `See all ${checks.length} checks`}
        <ChevronDown className={cn('size-[18px] transition-transform duration-200', open && 'rotate-180')} strokeWidth={2} />
      </button>
      {open && <CheckList id={id} checks={checks} className="animate-in duration-200 fade-in motion-reduce:animate-none" />}
    </>
  )
}

const checkIcons = {
  pass: { icon: CircleCheck, className: 'text-kbc-green', label: 'Passed' },
  warn: { icon: CircleAlert, className: 'text-kbc-warning', label: 'Needs a person' },
  fail: { icon: CircleX, className: 'text-kbc-danger', label: 'Failed' },
} as const

function CheckList({ checks, className, id }: { checks: OnboardingCheck[]; className?: string; id?: string }) {
  return (
    <ul id={id} className={cn('divide-y divide-kbc-line border-y border-kbc-line', className)}>
      {checks.map((c) => {
        const s = checkIcons[c.status]
        const StatusIcon = s.icon
        return (
          <li key={c.id} className="flex gap-3 py-3">
            <StatusIcon className={cn('mt-[1px] size-[20px] shrink-0', s.className)} strokeWidth={1.8} aria-label={s.label} />
            <span className="min-w-0">
              <span className="block text-[15px] font-bold break-words">{c.label}</span>
              <span className="block text-[14px] leading-[1.4] break-words text-kbc-muted">{c.detail}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** The open protocol: the same question Kate asks, available to any bank, shop or app. */
function ApiPanel({ apiKey, website }: { apiKey: string; website: string }) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const snippet = `curl -X POST ${origin}/api/trust/website \\\n  -H "Content-Type: application/json" \\\n  -d '{"url": "${website}"}'`
  return (
    <section className="mt-8">
      <h3 className="text-[18px] font-bold">Open API</h3>
      <p className="mt-1 max-w-[60ch] text-[15px] leading-[1.5] text-kbc-muted">
        Any bank, shop or app can ask KBC Trust the same question Kate asks. This request works on the demo server now.
      </p>
      <div className="mt-3 overflow-hidden rounded-[12px] border border-kbc-line">
        <div className="flex items-center gap-3 border-b border-kbc-line bg-kbc-pale px-4 py-2 text-[14px]">
          <span className="text-kbc-muted">Sandbox key</span>
          <span className="min-w-0 flex-1 truncate font-mono">{apiKey}</span>
          <CopyButton text={apiKey} label="Copy the sandbox key" />
        </div>
        <div className="flex items-start gap-2 bg-white py-3 pr-2 pl-4">
          <pre className="no-scrollbar min-w-0 flex-1 overflow-x-auto font-mono text-[13px] leading-[1.6] text-kbc-navy">{snippet}</pre>
          <CopyButton text={snippet.replace(/\\\n\s*/g, '')} label="Copy the request" />
        </div>
      </div>
      <p className="mt-2 text-[13px] text-kbc-muted">Sandbox key is simulated. The demo server doesn’t ask for it yet.</p>
    </section>
  )
}

/* ------------------------------------------------------------------------------------------------ */
/* Network and demo controls                                                                        */
/* ------------------------------------------------------------------------------------------------ */

/** Live list of verified partners. It grows during the demo, which is the scalability story. */
function Network({ directory }: { directory: Directory | null }) {
  if (!directory) return null
  return (
    <section aria-live="polite">
      <h2 className="text-[15px] font-bold">
        <span className="tabular-nums">{directory.count}</span> verified partners
      </h2>
      <ul className="mt-2 flex flex-col">
        {directory.partners.map((p) => (
          <li key={p.id} className="flex min-h-[34px] items-center gap-2 text-[14px]">
            <ShieldCheck className="size-[16px] shrink-0 text-kbc-green" strokeWidth={1.8} />
            <span className="min-w-0 flex-1 truncate">{p.shortName}</span>
            {p.joinedToday ? (
              <span className="animate-in rounded-full bg-kbc-success-bg px-2 py-[1px] text-[12px] font-bold whitespace-nowrap text-kbc-green duration-500 fade-in zoom-in-95">
                Joined today
              </span>
            ) : (
              <span className="text-[12.5px] whitespace-nowrap text-kbc-muted">{categoryLabels[p.category] ?? p.category}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Presenter shortcuts. Labelled as demo data so nobody mistakes them for part of the product. */
function DemoMenu({ onFill }: { onFill: (which: keyof typeof demoCompanies) => void }) {
  return (
    <div className="flex min-w-0 items-center gap-1 rounded-full bg-kbc-pale p-1 text-[13.5px]" role="group" aria-label="Demo data">
      <span className="hidden px-2 font-bold text-kbc-muted lg:inline">Demo</span>
      {(Object.keys(demoCompanies) as (keyof typeof demoCompanies)[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onFill(key)}
          title={demoCompanies[key].detail}
          className="min-h-[32px] rounded-full px-3 font-semibold whitespace-nowrap text-kbc-link transition-colors duration-150 hover:bg-white"
        >
          {demoCompanies[key].label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => askKate('Is zonnigreizen.be real?')}
        title="Ask Kate on the phone whether zonnigreizen.be is real"
        className="min-h-[32px] rounded-full px-3 font-semibold whitespace-nowrap text-kbc-link transition-colors duration-150 hover:bg-white"
      >
        Ask Kate
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */
/* Form parts                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

function StepFrame({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="animate-in duration-200 fade-in slide-in-from-right-2 motion-reduce:animate-none">
      <h2 className="text-[26px] leading-[1.25] font-extrabold tracking-[-0.01em]">{title}</h2>
      <p className="mt-1 mb-6 max-w-[60ch] text-[16px] leading-[1.5] text-kbc-muted">{intro}</p>
      {children}
    </div>
  )
}

function StepActions({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-wrap gap-3">{children}</div>
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[15px] font-bold">
        {label}
      </label>
      {children(id)}
      {hint && !error && <p className="mt-1 text-[14px] text-kbc-muted">{hint}</p>}
      <FieldError message={error} />
    </div>
  )
}

function TextInput({
  id,
  value,
  onChange,
  invalid,
  placeholder,
  inputMode,
  autoComplete,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  placeholder?: string
  inputMode?: 'numeric' | 'tel' | 'text'
  autoComplete?: string
}) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      autoComplete={autoComplete}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-[48px] w-full min-w-0 rounded-[8px] border bg-white px-3 text-[16px] text-kbc-navy placeholder:text-kbc-placeholder',
        invalid ? 'border-kbc-danger' : 'border-kbc-control',
      )}
    />
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-2 flex items-start gap-2 text-[14px] text-kbc-danger">
      <CircleAlert className="mt-[2px] size-[16px] shrink-0" strokeWidth={2} />
      {message}
    </p>
  )
}

/** A list of values with remove buttons and an add field, for domains and IBANs. */
function ListInput({
  label,
  values,
  onChange,
  placeholder,
  error,
  render,
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder: string
  error?: string
  render: (value: string) => ReactNode
}) {
  const [draft, setDraft] = useState('')
  const id = useId()
  const add = (e?: FormEvent) => {
    e?.preventDefault()
    const value = draft.trim()
    if (value && !values.includes(value)) onChange([...values, value])
    setDraft('')
  }
  return (
    <div>
      {values.length > 0 && (
        <ul className="mb-3 divide-y divide-kbc-line rounded-[12px] border border-kbc-line">
          {values.map((value) => (
            <li key={value} className="flex items-center gap-2 py-2 pr-2 pl-4">
              <span className="min-w-0 flex-1">{render(value)}</span>
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== value))}
                aria-label={`Remove ${value}`}
                className="grid size-[40px] shrink-0 place-items-center rounded-full text-kbc-muted transition-colors duration-150 hover:bg-kbc-pale hover:text-kbc-navy"
              >
                <X className="size-[18px]" strokeWidth={1.8} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="flex gap-3">
        <label htmlFor={id} className="sr-only">
          Add {label.toLowerCase()}
        </label>
        <TextInput id={id} value={draft} onChange={setDraft} placeholder={placeholder} invalid={Boolean(error)} />
        <SecondaryButton type="submit" disabled={!draft.trim()}>
          <Plus className="size-[18px]" strokeWidth={2} />
          Add
        </SecondaryButton>
      </form>
      <FieldError message={error} />
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex gap-4 py-3 text-[15px]">
      <dt className="w-[150px] shrink-0 text-kbc-muted">{label}</dt>
      <dd className={cn('min-w-0 flex-1 break-words', strong && 'font-bold')}>{value}</dd>
    </div>
  )
}

function InlineNote({ tone, icon: Icon, children }: { tone: 'success' | 'neutral'; icon: LucideIcon; children: ReactNode }) {
  return (
    <p
      className={cn(
        'mt-3 flex items-start gap-2 rounded-[8px] px-4 py-3 text-[15px] leading-[1.45]',
        tone === 'success' ? 'bg-kbc-success-bg text-kbc-green' : 'bg-kbc-surface-blue text-kbc-navy',
      )}
    >
      <Icon className={cn('mt-[2px] size-[18px] shrink-0', tone === 'neutral' && 'text-kbc-link')} strokeWidth={1.8} />
      <span>{children}</span>
    </p>
  )
}

function Status({ tone, icon: Icon, children }: { tone: 'success' | 'warning'; icon: LucideIcon; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-[24px] items-center gap-1 rounded-full px-2 text-[12.5px] font-bold whitespace-nowrap',
        tone === 'success' ? 'bg-kbc-success-bg text-kbc-green' : 'bg-kbc-warning-bg text-kbc-warning',
      )}
    >
      <Icon className="size-[14px]" strokeWidth={2} />
      {children}
    </span>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={label}
      className="grid size-[36px] shrink-0 place-items-center rounded-full text-kbc-link transition-colors duration-150 hover:bg-white"
    >
      {copied ? <Check className="size-[16px] text-kbc-green" strokeWidth={2.4} /> : <Copy className="size-[16px]" strokeWidth={1.8} />}
    </button>
  )
}

function PrimaryButton({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-kbc-blue px-6 text-[16px] font-semibold whitespace-nowrap text-white transition-[transform,background-color] duration-150 hover:bg-kbc-link active:scale-[0.98] disabled:bg-kbc-line disabled:text-kbc-muted"
    >
      {children}
    </button>
  )
}

function SecondaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-full border-[1.5px] border-kbc-blue bg-white px-5 text-[16px] font-semibold whitespace-nowrap text-kbc-link transition-[transform,background-color] duration-150 hover:bg-kbc-pale active:scale-[0.98] disabled:border-kbc-line disabled:text-kbc-muted disabled:hover:bg-white"
    >
      {children}
    </button>
  )
}
