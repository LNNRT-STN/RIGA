import { useId, type ReactNode } from 'react'
import { Building2, HeartHandshake, History, Landmark, Megaphone, ShieldCheck, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { guardianAngel } from '../data'
import { PushedPage } from '../layout'
import { useApp } from '../store'
import { dataTypes, partners, proactivityLabel, proactivityOptions, type DataKey, type PartnerId, type Proactivity } from '../trust/controls'

/**
 * Customer control for KBC Trust: what it may use, how proactive it may be, who is told, which
 * verified partners may reach you, and a log of what it did. Every change applies straight away.
 */
export function TrustDataScreen() {
  const { trustControls: controls, setTrustControls, logActivity, showToast, activity } = useApp()
  const dataOn = dataTypes.filter((d) => controls.data[d.key]).length
  const latest = activity[0]
  const logId = useId()

  const toggleData = (key: DataKey) => {
    const type = dataTypes.find((d) => d.key === key)!
    const on = !controls.data[key]
    setTrustControls((prev) => ({ ...prev, data: { ...prev.data, [key]: on } }))
    logActivity(
      `You switched ${on ? 'on' : 'off'} ${type.short}`,
      on ? `KBC Trust may use your ${type.short} again.` : `KBC Trust no longer uses your ${type.short}. Kate asks first.`,
    )
    showToast(on ? `KBC Trust may use your ${type.short}` : `KBC Trust no longer uses your ${type.short}`)
  }

  const setProactivity = (value: Proactivity) => {
    if (value === controls.proactivity) return
    setTrustControls((prev) => ({ ...prev, proactivity: value }))
    logActivity(`You chose “${proactivityLabel(value)}”`, proactivityOptions.find((o) => o.value === value)!.detail)
    showToast(`KBC Trust: ${proactivityLabel(value).toLowerCase()}`)
  }

  const toggleGuardian = () => {
    const on = !controls.guardianAngel
    setTrustControls((prev) => ({ ...prev, guardianAngel: on }))
    logActivity(
      on ? `${guardianAngel.name} is your Guardian Angel again` : `You stopped informing ${guardianAngel.name}`,
      on ? 'We inform them when KBC Trust stops a payment.' : 'Nobody else is told when KBC Trust stops a payment.',
    )
    showToast(on ? `We’ll inform ${guardianAngel.name}` : `We won’t inform ${guardianAngel.name}`)
  }

  const togglePartner = (id: PartnerId) => {
    const partner = partners.find((p) => p.id === id)!
    const on = !controls.partners[id]
    setTrustControls((prev) => ({ ...prev, partners: { ...prev.partners, [id]: on } }))
    logActivity(
      on ? `${partner.name} may send you invoices` : `${partner.name} can no longer reach you`,
      on ? 'Its invoices arrive in your app, already verified.' : 'Its invoices no longer arrive in your app. You can still pay them yourself.',
    )
    showToast(on ? `${partner.name} may send you invoices` : `${partner.name} can no longer send you invoices`)
  }

  return (
    <PushedPage title="What you share" className="bg-kbc-pale pb-12">
      <div className="bg-white px-4 pt-2 pb-5">
        <h2 className="text-[24px] leading-[1.25] font-extrabold tracking-[-0.01em] text-balance text-kbc-navy">Your data, your choice</h2>
        <p className="mt-1 text-[15.5px] leading-[1.45] text-kbc-navy">
          KBC Trust uses only what you allow here. Changes apply straight away, and you can undo them at any time.
        </p>
        <div className="mt-4 rounded-[12px] bg-kbc-pale px-4 py-3 text-[14.5px] leading-[1.4] text-kbc-navy" aria-live="polite">
          <p className="flex items-start gap-3">
            <ShieldCheck className="mt-[1px] size-[20px] shrink-0 text-kbc-blue" strokeWidth={1.8} />
            <span>
              <span className="font-bold">
                Uses {dataOn} of {dataTypes.length} types of data
              </span>
              <span className="block text-kbc-muted">
                {proactivityLabel(controls.proactivity)} · Guardian Angel {controls.guardianAngel ? 'on' : 'off'}
              </span>
            </span>
          </p>
          {latest && (
            <p className="mt-3 flex items-start gap-3 border-t border-kbc-line pt-3">
              <History className="mt-[1px] size-[20px] shrink-0 text-kbc-blue" strokeWidth={1.8} />
              <span className="min-w-0">
                <span className="block text-[12.5px] text-kbc-muted">Latest · {latest.when}</span>
                <span className="block font-semibold">{latest.title}</span>
                <button
                  type="button"
                  onClick={() => document.getElementById(logId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="mt-1 min-h-[32px] font-semibold text-kbc-link underline underline-offset-2"
                >
                  See everything KBC Trust did
                </button>
              </span>
            </p>
          )}
        </div>
      </div>

      <SectionTitle title="What KBC Trust may use" />
      <div className="divide-y divide-kbc-line bg-white">
        {dataTypes.map((type) => (
          <ToggleRow
            key={type.key}
            icon={type.icon}
            label={type.label}
            detail={type.uses}
            note={type.kept}
            on={controls.data[type.key]}
            onToggle={() => toggleData(type.key)}
          />
        ))}
      </div>
      <p className="px-4 pt-5 pb-2 text-[13.5px] font-bold text-kbc-navy">Always on</p>
      <div className="divide-y divide-kbc-line bg-white">
        <FixedRow icon={Landmark} label="Fraud monitoring by KBC" detail="Every bank must do this for every account" status="Required" />
        <FixedRow icon={Megaphone} label="Scam reports you make" detail="Only the account or phone number is shared, never your name" status="Anonymous" />
      </div>

      <SectionTitle title="How proactive KBC Trust is" detail="Before you pay a new beneficiary." />
      <fieldset className="bg-white">
        <legend className="sr-only">How proactive KBC Trust is</legend>
        <div className="divide-y divide-kbc-line">
          {proactivityOptions.map((option) => (
            <label key={option.value} className="flex min-h-[64px] cursor-pointer items-start gap-3 px-4 py-3 transition-colors duration-150 active:bg-kbc-pale">
              <input
                type="radio"
                name="proactivity"
                value={option.value}
                checked={controls.proactivity === option.value}
                onChange={() => setProactivity(option.value)}
                className="mt-[3px] size-[20px] shrink-0 accent-kbc-link"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-[16px] text-kbc-navy">
                  {option.label}
                  {option.value === 'stop' && (
                    <span className="rounded-full bg-kbc-success-bg px-2 py-[1px] text-[12px] font-bold text-kbc-green">Recommended</span>
                  )}
                </span>
                <span className="block text-[13.5px] leading-[1.4] text-kbc-muted">{option.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <SectionTitle title="Who we tell" />
      <div className="bg-white">
        <ToggleRow
          icon={HeartHandshake}
          label={`Guardian Angel: ${guardianAngel.name}`}
          detail={`We inform ${guardianAngel.relation} when KBC Trust stops a payment`}
          on={controls.guardianAngel}
          onToggle={toggleGuardian}
        />
      </div>

      <SectionTitle
        title="Verified partners"
        detail="KBC checked these companies, their accounts and their email domains. They may send invoices straight to Kate. They only learn whether their invoice reached you, never your balance or other payments."
      />
      <div className="divide-y divide-kbc-line bg-white">
        {partners.map((partner) => (
          <ToggleRow
            key={partner.id}
            icon={Building2}
            label={partner.name}
            detail={partner.sends}
            note={`Verified by KBC since ${partner.verifiedSince}`}
            on={controls.partners[partner.id]}
            onToggle={() => togglePartner(partner.id)}
          />
        ))}
      </div>

      <SectionTitle id={logId} title="What KBC Trust did" detail="Every check and every change, with the data it used." />
      <ol className="divide-y divide-kbc-line bg-white" aria-live="polite">
        {activity.map((entry) => (
          <li key={entry.id} className="animate-in px-4 py-3 duration-200 fade-in motion-reduce:animate-none">
            <p className="text-[12.5px] text-kbc-muted">{entry.when}</p>
            <p className="text-[15.5px] font-semibold text-kbc-navy">{entry.title}</p>
            <p className="text-[13.5px] leading-[1.4] text-kbc-muted">{entry.detail}</p>
          </li>
        ))}
      </ol>

      <p className="px-4 pt-5 text-[13px] leading-[1.4] text-kbc-muted">Demo: these settings are simulated and reset when the app reloads.</p>
    </PushedPage>
  )
}

function SectionTitle({ id, title, detail }: { id?: string; title: string; detail?: string }) {
  return (
    <div id={id} className="scroll-mt-2 px-4 pt-7 pb-2">
      <h2 className="text-[19px] font-extrabold text-kbc-navy">{title}</h2>
      {detail && <p className="mt-1 text-[14px] leading-[1.4] text-kbc-muted">{detail}</p>}
    </div>
  )
}

/** An on/off choice with what it means. The whole row is the switch, so the hit area is large. */
export function ToggleRow({
  icon: Icon,
  label,
  detail,
  note,
  on,
  onToggle,
}: {
  icon?: LucideIcon
  label: string
  detail: string
  note?: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex min-h-[64px] w-full items-center gap-4 px-4 py-3 text-left transition-colors duration-150 active:bg-kbc-pale"
    >
      {Icon && <Icon className={cn('size-[22px] shrink-0 transition-colors duration-200', on ? 'text-kbc-navy' : 'text-kbc-control')} strokeWidth={1.5} />}
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] text-kbc-navy">{label}</span>
        <span className="block text-[13.5px] leading-[1.4] text-kbc-muted">{detail}</span>
        {note && <span className="block text-[13px] leading-[1.4] text-kbc-muted">{note}</span>}
      </span>
      <Switch on={on} />
    </button>
  )
}

export function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative h-[31px] w-[51px] shrink-0 rounded-full border transition-colors duration-200',
        on ? 'border-kbc-blue bg-kbc-blue' : 'border-kbc-control bg-[#d5dbe2]',
      )}
    >
      <span
        className={cn(
          'absolute top-[1px] left-[1px] size-[27px] rounded-full bg-white shadow transition-transform duration-200',
          on && 'translate-x-[20px]',
        )}
      />
    </span>
  )
}

function FixedRow({ icon: Icon, label, detail, status }: { icon: LucideIcon; label: string; detail: string; status: ReactNode }) {
  return (
    <div className="flex min-h-[64px] items-center gap-4 px-4 py-3">
      <Icon className="size-[22px] shrink-0 text-kbc-navy" strokeWidth={1.5} />
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] text-kbc-navy">{label}</span>
        <span className="block text-[13.5px] leading-[1.4] text-kbc-muted">{detail}</span>
      </span>
      <span className="shrink-0 text-[14px] font-semibold text-kbc-muted">{status}</span>
    </div>
  )
}
