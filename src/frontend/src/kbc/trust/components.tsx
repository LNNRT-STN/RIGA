import { useEffect, useId, useState, type ReactNode } from 'react'
import {
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleX,
  LoaderCircle,
  Phone,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  ShieldX,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { checkSteps, type CheckStatus, type TrustLevel, type TrustResult } from './api'

type LevelStyle = { label: string; icon: LucideIcon; text: string; bg: string; ring: string }

const levelStyles: Record<TrustLevel, LevelStyle> = {
  verified: { label: 'Verified by KBC', icon: ShieldCheck, text: 'text-kbc-green', bg: 'bg-kbc-success-bg', ring: 'ring-kbc-green/25' },
  caution: { label: 'Be careful', icon: ShieldAlert, text: 'text-kbc-warning', bg: 'bg-kbc-warning-bg', ring: 'ring-kbc-warning/25' },
  review: { label: 'Checked by a person', icon: ShieldQuestion, text: 'text-kbc-link', bg: 'bg-kbc-surface-blue', ring: 'ring-kbc-link/25' },
  danger: { label: 'High risk', icon: ShieldX, text: 'text-kbc-danger', bg: 'bg-kbc-danger-bg', ring: 'ring-kbc-danger/25' },
}

/** Level label without the partner claim, for results that are safe but not from a KBC partner. */
function levelLabel(result: Pick<TrustResult, 'level' | 'verifiedPartner'>) {
  if (result.level === 'verified' && !result.verifiedPartner) return 'Looks safe'
  return levelStyles[result.level].label
}

/** The one compact signal that appears everywhere: level, wording and the 0 to 100 score. */
export function TrustBadge({ result, className }: { result: Pick<TrustResult, 'level' | 'score' | 'verifiedPartner'>; className?: string }) {
  const style = levelStyles[result.level]
  const Icon = style.icon
  return (
    <span
      className={cn(
        'inline-flex h-[28px] items-center gap-[6px] rounded-full pr-3 pl-[9px] text-[13.5px] font-bold whitespace-nowrap',
        style.bg,
        style.text,
        className,
      )}
    >
      <Icon className="size-[16px]" strokeWidth={2} />
      {levelLabel(result)}
      <span aria-hidden className="opacity-40">
        ·
      </span>
      <span className="tabular-nums">{result.score}</span>
      <span className="sr-only">out of 100</span>
    </span>
  )
}

const statusIcons: Record<CheckStatus, { icon: LucideIcon; className: string; label: string }> = {
  pass: { icon: CircleCheck, className: 'text-kbc-green', label: 'Passed' },
  warn: { icon: CircleAlert, className: 'text-kbc-warning', label: 'Warning' },
  fail: { icon: CircleX, className: 'text-kbc-danger', label: 'Failed' },
}

/**
 * Verdict at a glance, details on demand. The caller supplies the actions so each flow keeps one
 * primary action that fits its context (call the real sender, pay the verified account, hang up).
 */
export function TrustVerdict({
  result,
  actions,
  footer,
  className,
}: {
  result: TrustResult
  actions?: ReactNode
  footer?: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const detailsId = useId()
  const style = levelStyles[result.level]
  const Icon = style.icon

  return (
    <section
      aria-label={`KBC Trust: ${result.headline}`}
      className={cn('overflow-hidden rounded-[12px] bg-white shadow-[0_2px_10px_rgba(20,41,77,0.08)] ring-1', style.ring, className)}
    >
      <div className={cn('flex items-center gap-3 px-4 py-3', style.bg)}>
        <Icon className={cn('size-[26px] shrink-0', style.text)} strokeWidth={1.8} />
        <p className={cn('min-w-0 flex-1 text-[15px] leading-tight font-bold', style.text)}>
          {levelLabel(result)}
          <span className="block text-[12.5px] font-semibold opacity-80">KBC Trust score</span>
        </p>
        <p className={cn('shrink-0 text-right leading-none tabular-nums', style.text)}>
          <span className="text-[30px] font-extrabold tracking-[-0.02em]">{result.score}</span>
          <span className="text-[14px] font-bold opacity-70">/100</span>
        </p>
      </div>

      <div className="px-4 pt-3 pb-4">
        <h3 className="text-[18px] leading-[1.3] font-extrabold text-kbc-navy">{result.headline}</h3>
        <p className="mt-1 text-[15px] leading-[1.45] text-kbc-navy">{result.summary}</p>
        {actions && <div className="mt-4 flex flex-col gap-2">{actions}</div>}

        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((v) => !v)}
          className="mt-3 -ml-1 flex h-[40px] items-center gap-1 px-1 text-[14.5px] font-bold text-kbc-link"
        >
          {open ? 'Hide details' : `Why? See ${result.checks.length} checks`}
          <ChevronDown className={cn('size-[18px] transition-transform duration-200', open && 'rotate-180')} strokeWidth={2} />
        </button>

        {open && (
          <div id={detailsId} className="animate-in duration-200 fade-in slide-in-from-top-1 motion-reduce:animate-none">
            <ul className="divide-y divide-kbc-line border-t border-kbc-line">
              {result.checks.map((check) => {
                const status = statusIcons[check.status]
                const StatusIcon = status.icon
                return (
                  <li key={check.id} className="flex gap-3 py-3">
                    <StatusIcon className={cn('mt-[1px] size-[20px] shrink-0', status.className)} strokeWidth={1.8} aria-label={status.label} />
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-kbc-navy">{check.label}</span>
                      <span className="block text-[13.5px] leading-[1.4] text-kbc-muted">{check.detail}</span>
                    </span>
                  </li>
                )
              })}
            </ul>

            {result.extracted && Object.keys(result.extracted).length > 0 && (
              <>
                <h4 className="pt-3 pb-1 text-[13.5px] font-bold text-kbc-navy">What Kate read</h4>
                <dl className="rounded-[8px] bg-kbc-pale px-3 py-1">
                  {Object.entries(result.extracted).map(([label, value]) => (
                    <div key={label} className="flex gap-3 py-[6px] text-[13.5px]">
                      <dt className="w-[96px] shrink-0 text-kbc-muted">{label}</dt>
                      <dd className="min-w-0 flex-1 text-right break-words text-kbc-navy tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}

            {result.network && result.network.reports > 0 && (
              <p className="mt-3 text-[13.5px] leading-[1.4] text-kbc-navy">
                <span className="font-bold">{result.network.reports} KBC customers</span> reported this before. Each report warns
                every other KBC customer before they pay.
              </p>
            )}
          </div>
        )}

        <p className="mt-2 text-[12.5px] text-kbc-muted">
          Answered in {(result.elapsedMs / 1000).toFixed(1)} s by KBC Trust
          {footer}
        </p>
      </div>
    </section>
  )
}

/** The real, verified contact: the safe way to check directly with the sender. */
export function VerifiedContactButton({ name, phone, onCall }: { name: string; phone: string; onCall: () => void }) {
  return (
    <button
      type="button"
      onClick={onCall}
      className="flex min-h-[52px] w-full items-center gap-3 rounded-full bg-kbc-blue pr-5 pl-4 text-left text-white transition-transform duration-150 active:scale-[0.98] active:bg-kbc-link"
    >
      <Phone className="size-[20px] shrink-0" strokeWidth={1.8} />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[16px] font-semibold">Call {name}</span>
        <span className="block text-[13px] tabular-nums opacity-90">{phone} · verified number</span>
      </span>
    </button>
  )
}

export function SecondaryAction({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-[44px] w-full px-4 py-2 leading-tight rounded-full border-[1.5px] border-kbc-blue bg-white text-[15.5px] font-semibold text-kbc-link transition-transform duration-150 active:scale-[0.98] disabled:border-kbc-line disabled:text-kbc-muted"
    >
      {children}
    </button>
  )
}

/** Live progress while a check runs. Steps tick off on a timer that matches the paced API call. */
export function CheckingSteps({ subject, className }: { subject: TrustResult['subject']; className?: string }) {
  const steps = checkSteps[subject]
  const [done, setDone] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setDone((d) => Math.min(d + 1, steps.length - 1)), 520)
    return () => window.clearInterval(timer)
  }, [steps.length])

  return (
    <div role="status" className={cn('rounded-[12px] bg-kbc-pale px-4 py-3', className)}>
      <p className="flex items-center gap-2 pb-1 text-[14.5px] font-bold text-kbc-navy">
        <ShieldCheck className="size-[18px] text-kbc-blue" strokeWidth={1.8} />
        KBC Trust is checking
      </p>
      <ul>
        {steps.map((step, i) => (
          <li key={step} className={cn('flex items-center gap-2 py-[3px] text-[14px]', i <= done ? 'text-kbc-navy' : 'text-kbc-muted')}>
            {i < done ? (
              <Check className="size-[16px] text-kbc-green" strokeWidth={2.4} />
            ) : i === done ? (
              <LoaderCircle className="size-[16px] animate-spin text-kbc-blue" strokeWidth={2} />
            ) : (
              <span className="size-[16px]" />
            )}
            {step}
          </li>
        ))}
      </ul>
    </div>
  )
}
