import { useState } from 'react'
import { FileText, Globe, HeartHandshake, PhoneIncoming, ShieldCheck, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { guardianAngel, invoicesToPay } from '../data'
import { PushedPage } from '../layout'
import { useApp } from '../store'
import { Amount, ListRow } from '../ui'

/** KBC Trust home: the three "is this real?" checks, then the controls the customer keeps. */
export function TrustScreen() {
  const { push, setIncomingCall } = useApp()
  const [sharing, setSharing] = useState({ documents: true, calls: true, payments: true })
  const toggle = (key: keyof typeof sharing) => setSharing((prev) => ({ ...prev, [key]: !prev[key] }))

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
          label="Check every new beneficiary"
          detail="Risky payments are stopped before they leave"
          trailing={<span className="text-[14px] font-bold text-kbc-green">On</span>}
        />
        <ListRow
          icon={HeartHandshake}
          label={`Guardian Angel: ${guardianAngel.name}`}
          detail={`We inform ${guardianAngel.relation} when we stop a payment`}
        />
      </div>

      <h2 className="px-4 pt-7 pb-1 text-[19px] font-extrabold text-kbc-navy">What you share</h2>
      <p className="px-4 pb-3 text-[14px] leading-[1.4] text-kbc-muted">You choose what KBC Trust may use. Change it at any time.</p>
      <div className="bg-white">
        <ToggleRow label="Documents you upload" detail="Read once to check them, then deleted" on={sharing.documents} onToggle={() => toggle('documents')} />
        <ToggleRow label="Incoming calls" detail="Caller number, voice and video signals" on={sharing.calls} onToggle={() => toggle('calls')} />
        <ToggleRow label="Payment history" detail="To spot a changed account number" on={sharing.payments} onToggle={() => toggle('payments')} />
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

function ToggleRow({ label, detail, on, onToggle }: { label: string; detail: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex min-h-[60px] w-full items-center gap-4 px-4 py-2 text-left transition-colors duration-150 active:bg-kbc-pale"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] text-kbc-navy">{label}</span>
        <span className="block text-[13px] text-kbc-muted">{detail}</span>
      </span>
      <span className={cn('relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200', on ? 'bg-kbc-blue' : 'bg-[#d5dbe2]')}>
        <span
          className={cn(
            'absolute top-[2px] left-[2px] size-[27px] rounded-full bg-white shadow transition-transform duration-200',
            on && 'translate-x-[20px]',
          )}
        />
      </span>
    </button>
  )
}

/** Invoices waiting to be paid, from Zoomit and forwarded emails. Opens a prefilled transfer. */
export function InvoicesScreen() {
  const { push, accounts } = useApp()
  return (
    <PushedPage title="Pay an invoice" className="pb-12">
      <p className="px-4 pt-2 pb-3 text-[15px] leading-[1.45] text-kbc-muted">
        KBC Trust checks every invoice before you pay it.
      </p>
      <ul className="divide-y divide-kbc-line border-y border-kbc-line">
        {invoicesToPay.map((invoice) => {
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
    </PushedPage>
  )
}
