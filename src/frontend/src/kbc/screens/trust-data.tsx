import { useId } from 'react'
import { Building2, HeartHandshake, type LucideIcon } from 'lucide-react'
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
        <p className="mt-1 text-[15.5px] leading-[1.45] text-kbc-navy">KBC Trust uses only what you allow here.</p>
      </div>

      <SectionTitle title="What KBC Trust may use" />
      <div className="divide-y divide-kbc-line bg-white">
        {dataTypes.map((type) => (
          <ToggleRow
            key={type.key}
            icon={type.icon}
            label={type.label}
            detail={type.kept}
            on={controls.data[type.key]}
            onToggle={() => toggleData(type.key)}
          />
        ))}
      </div>

      <SectionTitle title="Before you pay someone new" />
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

      <SectionTitle title="Companies that may send you invoices" />
      <div className="divide-y divide-kbc-line bg-white">
        {partners.map((partner) => (
          <ToggleRow
            key={partner.id}
            icon={Building2}
            label={partner.name}
            detail="Verified by KBC"
            on={controls.partners[partner.id]}
            onToggle={() => togglePartner(partner.id)}
          />
        ))}
      </div>

      <SectionTitle id={logId} title="What KBC Trust did" />
      <ol className="divide-y divide-kbc-line bg-white" aria-live="polite">
        {activity.map((entry) => (
          <li key={entry.id} className="animate-in px-4 py-3 duration-200 fade-in motion-reduce:animate-none">
            <p className="text-[12.5px] text-kbc-muted">{entry.when}</p>
            <p className="text-[15.5px] font-semibold text-kbc-navy">{entry.title}</p>
          </li>
        ))}
      </ol>

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
