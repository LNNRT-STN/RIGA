import { useEffect, useState, type ReactNode } from 'react'
import {
  ChevronRight,
  CircleCheck,
  FileText,
  LoaderCircle,
  QrCode,
  ShieldX,
  SquareArrowRight,
  SquareArrowUpRight,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { beneficiaries, business, guardianAngel, type Account } from '../data'
import { formatAmount, formatIban, isValidBelgianIban, parseAmount } from '../format'
import { PushedPage } from '../layout'
import { useApp, type TransferPrefill } from '../store'
import { Amount } from '../ui'
import { checkPayee, type TrustResult } from '../trust/api'
import { CheckingSteps, SecondaryAction, TrustBadge, TrustVerdict } from '../trust/components'
import { dataUse } from '../trust/controls'

/** Bottom sheet behind the floating transfer button. */
export function QuickPaySheet() {
  const { quickPayOpen, setQuickPayOpen, push, showToast } = useApp()
  if (!quickPayOpen) return null
  const close = () => setQuickPayOpen(false)
  const soon = (what: string) => () => {
    close()
    showToast(`${what} is not part of this demo`)
  }

  return (
    <div className="absolute inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 animate-in bg-kbc-navy/45 duration-200 fade-in"
      />
      <div
        role="dialog"
        aria-label="Pay and transfer"
        className="absolute inset-x-0 bottom-0 animate-in rounded-t-[20px] bg-white pt-2 pb-[calc(var(--safe-bottom)+12px)] shadow-[0_-12px_32px_rgba(20,41,77,0.14)] duration-300 ease-out slide-in-from-bottom motion-reduce:animate-none"
      >
        <span aria-hidden className="mx-auto block h-[5px] w-[40px] rounded-full bg-[#d5dbe2]" />
        <h2 className="px-4 pt-4 pb-3 text-[19px] font-extrabold text-kbc-navy">Quick pay</h2>
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4">
          <QuickContact label="Own account" onClick={() => push({ name: 'transfer', beneficiaryId: 'own' })}>
            <span className="grid size-[44px] place-items-center rounded-[10px] bg-kbc-sky text-white">
              <Wallet className="size-6" strokeWidth={1.5} />
            </span>
          </QuickContact>
          {beneficiaries.map((b) => (
            <QuickContact key={b.id} label={b.name} onClick={() => push({ name: 'transfer', beneficiaryId: b.id })}>
              <span className="grid size-[44px] place-items-center rounded-[10px] bg-kbc-pale text-[20px] font-bold text-kbc-navy">
                {b.name[0]}
              </span>
            </QuickContact>
          ))}
        </div>
        <h2 className="px-4 pt-6 pb-3 text-[19px] font-extrabold text-kbc-navy">All actions</h2>
        <div className="grid grid-cols-3 px-2">
          <BigAction icon={SquareArrowRight} label="Receive money" onClick={soon('Receiving money')} />
          <BigAction icon={QrCode} label="Scan code" onClick={soon('Scanning a code')} />
          <BigAction icon={SquareArrowUpRight} label="Transfer" accent onClick={() => push({ name: 'transfer' })} />
        </div>
        <div className="pt-4">
          <SheetRow icon={FileText} label="Pay an invoice" onClick={() => push({ name: 'invoices' })} />
          <SheetRow icon={Users} label="Split group expenses" onClick={soon('Splitting expenses')} />
        </div>
      </div>
    </div>
  )
}

function QuickContact({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex w-[64px] shrink-0 flex-col items-center gap-[6px]">
      {children}
      <span className="line-clamp-2 text-center text-[11px] leading-[1.2] text-kbc-navy uppercase">{label}</span>
    </button>
  )
}

function BigAction({ icon: Icon, label, onClick, accent = false }: { icon: LucideIcon; label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2">
      <span
        className={cn(
          'grid size-[64px] place-items-center rounded-full text-white shadow-[0_4px_10px_rgba(20,41,77,0.18)] transition-transform duration-150 active:scale-95',
          accent ? 'bg-[#1f8fdc]' : 'bg-kbc-navy',
        )}
      >
        <Icon className="size-[28px]" strokeWidth={1.4} />
      </span>
      <span className="text-[13.5px] text-kbc-navy">{label}</span>
    </button>
  )
}

function SheetRow({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-[50px] w-full items-center gap-4 px-4 text-left">
      <Icon className="size-[22px] text-kbc-navy" strokeWidth={1.4} />
      <span className="flex-1 text-[16.5px] text-kbc-navy">{label}</span>
      <ChevronRight className="size-5 text-kbc-navy" strokeWidth={1.5} />
    </button>
  )
}

type Stage = 'form' | 'review' | 'processing' | 'done'

/** `startInReview` opens a complete prefill on the review screen, for the guided tour. */
export function TransferScreen({
  beneficiaryId,
  prefill,
  startInReview = false,
}: {
  beneficiaryId?: string
  prefill?: TransferPrefill
  startInReview?: boolean
}) {
  const { accounts, makeTransfer, pop, popToRoot } = useApp()
  const preset = beneficiaries.find((b) => b.id === beneficiaryId)
  const [fromId, setFromId] = useState(prefill?.fromId ?? (beneficiaryId === 'own' ? 'savings' : 'current'))
  const ownTarget = beneficiaryId === 'own' ? accounts.find((a) => a.id !== fromId) : undefined
  const [name, setName] = useState(prefill?.name ?? preset?.name ?? ownTarget?.name ?? '')
  const [iban, setIban] = useState(prefill?.iban ?? preset?.iban ?? ownTarget?.iban ?? '')
  const [amountText, setAmountText] = useState(prefill?.amount ?? '')
  const [message, setMessage] = useState(prefill?.message ?? '')
  const [stage, setStage] = useState<Stage>(startInReview && prefill ? 'review' : 'form')
  const [errors, setErrors] = useState<Partial<Record<'name' | 'iban' | 'amount', string>>>({})
  const [reference, setReference] = useState('')

  const from = accounts.find((a) => a.id === fromId) ?? accounts[0]
  const amount = parseAmount(amountText)

  const review = () => {
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Enter the name of the beneficiary.'
    if (!isValidBelgianIban(iban)) next.iban = 'Enter a Belgian account number, for example BE71 0961 2345 6769.'
    if (Number.isNaN(amount) || amount <= 0) next.amount = 'Enter an amount, for example 25.00.'
    else if (amount > from.balance) next.amount = `This is more than the ${formatAmount(from.balance)} on this account.`
    setErrors(next)
    if (Object.keys(next).length === 0) setStage('review')
  }

  const confirm = () => {
    setStage('processing')
    window.setTimeout(() => {
      setReference(makeTransfer({ fromId, toName: name.trim(), toIban: formatIban(iban), amount, message: message.trim() }))
      setStage('done')
    }, 1300)
  }

  if (stage === 'done' || stage === 'processing') {
    return (
      <PushedPage title="Transfer" onBack={stage === 'done' ? popToRoot : () => undefined}>
        <div className="flex flex-col items-center px-6 pt-20 text-center" aria-live="polite">
          {stage === 'processing' ? (
            <>
              <LoaderCircle className="size-14 animate-spin text-kbc-blue" strokeWidth={1.5} />
              <p className="mt-6 text-[19px] font-bold text-kbc-navy">Sending your transfer</p>
              <p className="mt-2 text-[15px] text-kbc-muted">This only takes a moment.</p>
            </>
          ) : (
            <>
              <CircleCheck className="size-16 animate-in text-kbc-green duration-300 zoom-in-75" strokeWidth={1.4} />
              <p className="mt-6 text-[21px] font-extrabold text-kbc-navy">Transfer sent</p>
              <p className="mt-2 text-[15.5px] leading-[1.45] text-kbc-navy">
                {formatAmount(amount)} is on its way to {name}. It will arrive today.
              </p>
              <p className="mt-4 text-[13.5px] text-kbc-muted">
                Reference {reference} · Simulated, no real money was moved
              </p>
              <button
                type="button"
                onClick={popToRoot}
                className="mt-10 h-[48px] w-full rounded-full bg-kbc-blue text-[17px] font-semibold text-white"
              >
                Done
              </button>
            </>
          )}
        </div>
      </PushedPage>
    )
  }

  if (stage === 'review') {
    return (
      <PushedPage title="Check your transfer" onBack={() => setStage('form')}>
        <ReviewStage
          name={name}
          iban={iban}
          amount={amount}
          from={from}
          message={message}
          onUseIban={(verified) => setIban(verified)}
          onConfirm={confirm}
          onCancel={pop}
        />
      </PushedPage>
    )
  }

  return (
    <PushedPage title="Transfer">
      <form
        className="flex flex-col gap-5 px-4 pt-3 pb-10"
        onSubmit={(e) => {
          e.preventDefault()
          review()
        }}
        noValidate
      >
        <fieldset>
          <legend className="pb-2 text-[14.5px] font-semibold text-kbc-navy">From</legend>
          <div className="flex flex-col gap-2">
            {accounts.map((a) => (
              <label
                key={a.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-[10px] border-[1.5px] px-3 py-3 transition-colors duration-150',
                  a.id === fromId ? 'border-kbc-blue bg-kbc-pale' : 'border-kbc-line',
                )}
              >
                <input
                  type="radio"
                  name="from"
                  checked={a.id === fromId}
                  onChange={() => setFromId(a.id)}
                  className="size-[18px] accent-kbc-link"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-kbc-navy uppercase">{a.name}</span>
                  <span className="block text-[13px] text-kbc-muted">{a.iban}</span>
                </span>
                <Amount value={a.balance} className="text-[15px] font-bold text-kbc-navy" />
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Beneficiary name" error={errors.name}>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" className={inputClass(errors.name)} />
        </Field>
        <Field label="Account number" error={errors.iban}>
          <input
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            onBlur={() => setIban((v) => formatIban(v))}
            placeholder="BE00 0000 0000 0000"
            autoComplete="off"
            className={inputClass(errors.iban)}
          />
        </Field>
        <Field label="Amount (EUR)" error={errors.amount}>
          <input
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className={cn(inputClass(errors.amount), 'text-[22px] font-bold tabular-nums')}
          />
        </Field>
        <Field label="Message (optional)">
          <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={140} className={inputClass()} />
        </Field>

        <button
          type="submit"
          className="mt-2 h-[48px] w-full rounded-full bg-kbc-blue text-[17px] font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
        >
          Continue
        </button>
      </form>
    </PushedPage>
  )
}

/**
 * Review step with the proactive KBC Trust check: before the customer can confirm, the payee is
 * checked. High risk blocks the payment, mid risk warns, uncertain cases go to Secure4u.
 */
function ReviewStage({
  name,
  iban,
  amount,
  from,
  message,
  onUseIban,
  onConfirm,
  onCancel,
}: {
  name: string
  iban: string
  amount: number
  from: Account
  message: string
  onUseIban: (iban: string) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const { showToast, popToRoot, push, trustControls, logActivity } = useApp()
  const isBusiness = from.kind === 'business'
  // Results are keyed by the payee, so switching to the verified account starts a fresh check.
  const key = `${name.trim()}|${formatIban(iban)}|${isBusiness}`
  const [check, setCheck] = useState<{ key: string; result?: TrustResult; failed?: boolean } | null>(null)
  // A check the customer started by hand for this payee, when automatic checks are off.
  const [askedKey, setAskedKey] = useState<string | null>(null)
  const [overrideKey, setOverrideKey] = useState<string | null>(null)
  const trust = check?.key === key ? (check.result ?? null) : null
  const failed = check?.key === key && check.failed === true

  // The proactive check compares the payee with the customer's payment history, so it runs on its
  // own only when the customer allows both. Otherwise the customer can start it once, by hand.
  const autoCheck = trustControls.proactivity !== 'ask' && trustControls.data.payments
  const runCheck = autoCheck || askedKey === key
  const mode = trustControls.proactivity

  useEffect(() => {
    if (!runCheck) return
    let current = true
    checkPayee({ name: name.trim(), iban: formatIban(iban), account: isBusiness ? 'business' : 'personal' })
      .then((result) => {
        if (!current) return
        setCheck({ key, result })
        const { used, kept } = dataUse('payee')
        logActivity(`Checked a payment to ${name.trim()}`, `Used ${used}. ${kept} Result: ${result.headline}`)
      })
      .catch(() => current && setCheck({ key, failed: true }))
    return () => {
      current = false
    }
  }, [runCheck, key, name, iban, isBusiness, logActivity])

  const guardianLine = isBusiness
    ? `${business.ceo}, second approver at ${business.name}, has been informed.`
    : trustControls.guardianAngel
      ? `Your Guardian Angel ${guardianAngel.name} has been informed.`
      : 'You chose not to inform a Guardian Angel.'

  // "Stop risky payments" blocks; "Warn me, I decide" shows the same verdict but leaves the choice to the customer.
  if (trust?.decision === 'block' && !(mode !== 'stop' && overrideKey === key)) {
    const contact = trust.verifiedContact
    return (
      <div className="px-4 pt-3 pb-10" aria-live="polite">
        <p className="flex items-center gap-2 pb-3 text-[15px] font-bold text-kbc-danger">
          <ShieldX className="size-[20px]" strokeWidth={1.8} />
          Payment of {formatAmount(amount)} stopped
        </p>
        <TrustVerdict
          result={trust}
          actions={
            <>
              {contact?.iban && (
                <button
                  type="button"
                  onClick={() => onUseIban(contact.iban!)}
                  className="min-h-[48px] w-full rounded-full bg-kbc-blue px-4 py-2 text-[16px] leading-tight font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
                >
                  Pay the verified account
                  <span className="block text-[13px] font-normal tabular-nums opacity-90">{contact.iban}</span>
                </button>
              )}
              {contact && (
                <SecondaryAction onClick={() => showToast(`Calling ${contact.name} on ${contact.phone} (simulated)`)}>
                  Call {contact.name}
                  <span className="block text-[13px] font-normal tabular-nums">{contact.phone} · verified number</span>
                </SecondaryAction>
              )}
            </>
          }
        />
        <p className="mt-4 rounded-[8px] bg-kbc-pale px-4 py-3 text-[13.5px] leading-[1.45] text-kbc-navy">
          {mode === 'stop'
            ? `No money has left your account. ${guardianLine}`
            : 'You chose “Warn me, I decide”. No money has left your account yet.'}
        </p>
        {mode !== 'stop' && (
          <button
            type="button"
            onClick={() => {
              setOverrideKey(key)
              logActivity(`You chose to pay ${name.trim()} despite a warning`, `KBC Trust score ${trust.score}. Your choice, as set in What you share.`)
            }}
            className="mt-2 h-[48px] w-full rounded-full text-[16px] font-semibold text-kbc-danger"
          >
            I know this beneficiary, continue
          </button>
        )}
        <button type="button" onClick={popToRoot} className="mt-2 h-[48px] w-full rounded-full text-[17px] font-semibold text-kbc-link">
          Cancel payment
        </button>
      </div>
    )
  }

  // Secure4u review is part of "Stop risky payments"; with "Warn me, I decide" the customer confirms.
  const needsReview = trust?.decision === 'review' && mode === 'stop'
  const unchecked = !runCheck
  const canConfirm = unchecked || failed || (trust !== null && !needsReview)

  return (
    <div className="px-4 pt-4 pb-10">
      <div className="rounded-[12px] bg-kbc-pale px-4 py-6 text-center">
        <p className="text-[14.5px] text-kbc-muted">You are sending</p>
        <Amount value={amount} className="mt-1 block text-[32px] font-extrabold text-kbc-navy" />
      </div>
      <dl className="mt-4 divide-y divide-kbc-line">
        <ReviewRow
          label="To"
          value={name}
          detail={formatIban(iban)}
          badge={trust && trust.decision === 'allow' ? <TrustBadge result={trust} className="mt-2" /> : undefined}
        />
        <ReviewRow label="From" value={from.name} detail={from.iban} />
        <ReviewRow label="Date" value="Today, 20 Oct 2026" />
        <ReviewRow label="Message" value={message.trim() || 'No message'} />
        <ReviewRow label="Costs" value="Free" />
      </dl>

      <div aria-live="polite" className="mt-2">
        {unchecked && (
          <div className="rounded-[12px] bg-kbc-pale px-4 py-3">
            <p className="text-[14.5px] font-bold text-kbc-navy">KBC Trust didn’t check this beneficiary</p>
            <p className="mt-1 text-[13.5px] leading-[1.45] text-kbc-navy">
              {trustControls.data.payments
                ? 'You asked KBC Trust to check only when you ask.'
                : 'You switched off payment history, so KBC Trust can’t compare this payment with earlier ones.'}
            </p>
            <div className="mt-3">
              <SecondaryAction onClick={() => setAskedKey(key)}>
                {trustControls.data.payments ? 'Check this beneficiary' : 'Allow once and check'}
              </SecondaryAction>
            </div>
            <p className="mt-2 text-[12.5px] leading-[1.45] text-kbc-muted">
              A check uses {dataUse('payee').used}. {dataUse('payee').kept}{' '}
              <button type="button" onClick={() => push({ name: 'trust-data' })} className="font-semibold text-kbc-link underline underline-offset-2">
                What you share
              </button>
            </p>
          </div>
        )}
        {runCheck && !trust && !failed && <CheckingSteps subject="payee" />}
        {failed && (
          <p className="rounded-[8px] bg-kbc-warning-bg px-4 py-3 text-[13.5px] leading-[1.4] text-kbc-warning">
            KBC Trust could not check this account right now. Only continue if you know the beneficiary.
          </p>
        )}
        {trust && trust.decision !== 'allow' && <TrustVerdict result={trust} onManageData={() => push({ name: 'trust-data' })} />}
      </div>

      <p className="mt-4 rounded-[8px] bg-kbc-warning-bg px-4 py-3 text-[13.5px] leading-[1.4] text-kbc-warning">
        Demo: this transfer is simulated with fictional data.
      </p>
      {needsReview ? (
        <button
          type="button"
          onClick={() => {
            showToast('Secure4u will review this payment within 15 minutes (simulated)')
            popToRoot()
          }}
          className="mt-6 h-[48px] w-full rounded-full bg-kbc-blue text-[17px] font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
        >
          Send to Secure4u for review
        </button>
      ) : (
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm}
          className="mt-6 h-[48px] w-full rounded-full bg-kbc-blue text-[17px] font-semibold text-white transition-[transform,opacity] duration-150 active:scale-[0.98] disabled:opacity-50"
        >
          {canConfirm ? 'Confirm transfer' : 'Checking the beneficiary'}
        </button>
      )}
      <button type="button" onClick={onCancel} className="mt-2 h-[48px] w-full rounded-full text-[17px] font-semibold text-kbc-link">
        Cancel
      </button>
    </div>
  )
}


function inputClass(error?: string) {
  return cn(
    'h-[48px] w-full rounded-[8px] border-[1.5px] bg-white px-3 text-[16px] text-kbc-navy outline-none placeholder:text-kbc-placeholder focus:border-kbc-blue',
    error ? 'border-kbc-danger' : 'border-kbc-control',
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block pb-2 text-[14.5px] font-semibold text-kbc-navy">{label}</span>
      {children}
      {error && <span className="block pt-[6px] text-[13.5px] text-kbc-danger">{error}</span>}
    </label>
  )
}

function ReviewRow({ label, value, detail, badge }: { label: string; value: string; detail?: string; badge?: ReactNode }) {
  return (
    <div className="flex gap-4 py-3">
      <dt className="w-[86px] shrink-0 text-[14.5px] text-kbc-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-right">
        <span className="block text-[15.5px] break-words text-kbc-navy">{value}</span>
        {detail && <span className="block text-[13px] text-kbc-muted">{detail}</span>}
        {badge}
      </dd>
    </div>
  )
}
