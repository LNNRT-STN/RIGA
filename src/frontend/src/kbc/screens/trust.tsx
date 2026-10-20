import { Building2, ChevronRight, FileText, Globe, HeartHandshake, PhoneIncoming, ShieldCheck, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { guardianAngel, invoicesToPay } from '../data'
import { PushedPage } from '../layout'
import { useApp } from '../store'
import { dataTypes, partnerForSupplier, partners, proactivityLabel, proactivityOptions } from '../trust/controls'
import { Amount, ListRow } from '../ui'

/** KBC Trust home: the three "is this real?" checks, then the choices the customer keeps. */
export function TrustScreen() {
  const { push, setIncomingCall, trustControls: controls } = useApp()
  const manage = () => push({ name: 'trust-data' })
  const partnersOn = partners.filter((p) => controls.partners[p.id]).length

  return (
    <PushedPage title="KBC Trust" className="bg-kbc-pale pb-12">
      <div className="bg-white px-4 pt-2 pb-6">
        <h2 className="text-[24px] leading-[1.25] font-extrabold tracking-[-0.01em] text-kbc-navy">Is this real?</h2>
        <p className="mt-1 text-[15.5px] leading-[1.45] text-kbc-navy">
          Kate checks invoices, callers and websites against KBC’s verified partners and reports from other KBC customers.
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <CheckTile icon={FileText} label="Invoice or email" onClick={() => push({ name: 'kate', attach: true })} />
          <CheckTile icon={PhoneIncoming} label="Caller" onClick={() => setIncomingCall(true)} />
          <CheckTile icon={Globe} label="Website" onClick={() => push({ name: 'kate', prompt: 'Is proximus-betaling.be real?' })} />
        </div>
      </div>

      <h2 className="px-4 pt-7 pb-2 text-[19px] font-extrabold text-kbc-navy">Before you pay</h2>
      <div className="bg-white">
        <ListRow
          icon={ShieldCheck}
          label={proactivityLabel(controls.proactivity)}
          detail={proactivityOptions.find((o) => o.value === controls.proactivity)?.detail}
          onClick={manage}
        />
        <ListRow
          icon={HeartHandshake}
          label={`Guardian Angel: ${guardianAngel.name}`}
          detail={controls.guardianAngel ? `We inform ${guardianAngel.relation} when we stop a payment` : 'Off: nobody else is told'}
          onClick={manage}
        />
      </div>

      <h2 className="px-4 pt-7 pb-1 text-[19px] font-extrabold text-kbc-navy">What you share</h2>
      <p className="px-4 pb-3 text-[14px] leading-[1.4] text-kbc-muted">You choose what KBC Trust may use. Change it at any time.</p>
      <div className="bg-white">
        {dataTypes.map((type) => (
          <ListRow
            key={type.key}
            icon={type.icon}
            label={type.label}
            detail={type.kept}
            onClick={manage}
            trailing={<OnOff on={controls.data[type.key]} />}
          />
        ))}
        <ListRow
          icon={Building2}
          label="Verified partners"
          detail={`${partnersOn} of ${partners.length} may send you invoices`}
          onClick={manage}
        />
      </div>
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={manage}
          className="h-[48px] w-full rounded-full border-[1.5px] border-kbc-blue bg-white text-[16px] font-semibold text-kbc-link transition-transform duration-150 active:scale-[0.98]"
        >
          Manage what you share
        </button>
      </div>
    </PushedPage>
  )
}

function CheckTile({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-[12px] bg-kbc-pale px-2 text-center transition-transform duration-150 active:scale-[0.97]"
    >
      <Icon className="size-[28px] text-kbc-blue" strokeWidth={1.5} />
      <span className="text-[14px] leading-[1.25] font-semibold text-kbc-navy">{label}</span>
    </button>
  )
}

/** On or off in words and colour, so the state never depends on colour alone. */
function OnOff({ on }: { on: boolean }) {
  return (
    <span className={cn('flex shrink-0 items-center gap-1 text-[14px] font-bold', on ? 'text-kbc-green' : 'text-kbc-muted')}>
      {on ? 'On' : 'Off'}
      <ChevronRight className="size-5 text-kbc-navy" strokeWidth={1.5} />
    </span>
  )
}

/** Invoices waiting to be paid, from Zoomit and forwarded emails. Opens a prefilled transfer. */
export function InvoicesScreen() {
  const { push, accounts, trustControls } = useApp()
  // Invoices a verified partner delivers itself (Zoomit) stop arriving when the customer switches it off.
  // Invoices that came by email stay: the customer brought those in.
  const blocked = invoicesToPay.filter((i) => {
    const partner = partnerForSupplier(i.supplier)
    return i.source === 'Zoomit' && partner !== undefined && !trustControls.partners[partner.id]
  })
  const shown = invoicesToPay.filter((i) => !blocked.includes(i))
  return (
    <PushedPage title="Pay an invoice" className="pb-12">
      <p className="px-4 pt-2 pb-3 text-[15px] leading-[1.45] text-kbc-muted">
        KBC Trust checks every invoice before you pay it.
      </p>
      <ul className="divide-y divide-kbc-line border-y border-kbc-line">
        {shown.map((invoice) => {
          const account = accounts.find((a) => a.id === invoice.accountId)
          return (
            <li key={invoice.id}>
              <button
                type="button"
                onClick={() =>
                  push({
                    name: 'transfer',
                    prefill: {
                      fromId: invoice.accountId,
                      name: invoice.supplier,
                      iban: invoice.iban,
                      amount: invoice.amount.toFixed(2),
                      message: invoice.reference,
                    },
                  })
                }
                className="flex min-h-[72px] w-full items-center gap-4 px-4 py-3 text-left transition-colors duration-150 active:bg-kbc-pale"
              >
                <span className="grid size-[40px] shrink-0 place-items-center rounded-[8px] bg-kbc-pale text-kbc-navy">
                  <FileText className="size-[22px]" strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold text-kbc-navy">{invoice.supplier}</span>
                  <span className="block text-[13px] text-kbc-muted">
                    Due {invoice.due} · {account?.name}
                  </span>
                  <span className="block text-[13px] text-kbc-muted">{invoice.source}</span>
                </span>
                <Amount value={-invoice.amount} className="shrink-0 text-[16px] font-bold text-kbc-navy" />
              </button>
            </li>
          )
        })}
      </ul>
      {blocked.length > 0 && (
        <p className="px-4 pt-4 text-[14px] leading-[1.45] text-kbc-muted">
          {blocked.map((i) => partnerForSupplier(i.supplier)?.name).join(' and ')} can’t send you invoices, because you switched{' '}
          {blocked.length > 1 ? 'them' : 'it'} off.{' '}
          <button type="button" onClick={() => push({ name: 'trust-data' })} className="font-semibold text-kbc-link underline underline-offset-2">
            Change what you share
          </button>
        </p>
      )}
    </PushedPage>
  )
}
