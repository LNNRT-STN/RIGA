import { useEffect, useState } from 'react'
import { LoaderCircle, Phone, PhoneOff, ShieldOff, ShieldX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { business } from '../data'
import { useApp } from '../store'
import { checkCall, reportScam, type TrustResult } from '../trust/api'
import { SecondaryAction, TrustVerdict, VerifiedContactButton } from '../trust/components'
import { dataUse } from '../trust/controls'

type Stage = 'ringing' | 'live' | 'ended'

// Simulated incoming video call. The caller and every detector signal come from the backend's
// "ceo-deepfake" scenario; no real call, voice or video is analysed in this prototype.
const callerNumber = '+32 465 89 21 07'
const request = 'Laura, I need you to pay €48,500.00 to our notary today. It’s a new account. Keep this between us for now.'

/** A deepfake CEO video call, with KBC Trust checking the caller before and during the call. */
export function IncomingCall() {
  const { setIncomingCall, showToast, trustControls, setTrustControls, logActivity } = useApp()
  const callsOn = trustControls.data.calls
  const [stage, setStage] = useState<Stage>('ringing')
  const [trust, setTrust] = useState<TrustResult | null>(null)
  const [failed, setFailed] = useState(false)
  const [heard, setHeard] = useState(false)
  const [showVerdict, setShowVerdict] = useState(false)
  const [reported, setReported] = useState(false)

  // The caller is only analysed when the customer allows KBC Trust to use call signals.
  useEffect(() => {
    if (!callsOn) return
    let current = true
    checkCall('ceo-deepfake')
      .then((result) => {
        if (!current) return
        setTrust(result)
        const { used, kept } = dataUse('call')
        logActivity(`Checked a video call from ${callerNumber}`, `Used ${used}. ${kept} Result: ${result.headline}`)
      })
      .catch(() => current && setFailed(true))
    return () => {
      current = false
    }
  }, [callsOn, logActivity])

  const turnOnChecks = () => {
    setTrustControls((prev) => ({ ...prev, data: { ...prev.data, calls: true } }))
    logActivity('You switched on calls', 'KBC Trust may use your calls again.')
  }

  useEffect(() => {
    if (stage !== 'live') return
    const caption = window.setTimeout(() => setHeard(true), 900)
    const verdict = window.setTimeout(() => setShowVerdict(true), 2300)
    return () => {
      window.clearTimeout(caption)
      window.clearTimeout(verdict)
    }
  }, [stage])

  const close = () => setIncomingCall(false)
  const contact = trust?.verifiedContact
  const callBack = () => {
    if (contact) showToast(`Calling ${contact.name} on ${contact.phone} (simulated)`)
    close()
  }
  const report = async () => {
    try {
      const { message } = await reportScam({ number: callerNumber })
      setReported(true)
      showToast(message)
      logActivity('You reported a phone number as a scam', `Only ${callerNumber} was shared with other KBC customers, never your name.`)
    } catch {
      showToast('Reporting is not available right now. Please try again.')
    }
  }

  if (stage === 'ended') {
    return (
      <div className="absolute inset-0 z-[90] flex animate-in flex-col bg-white px-4 pt-[calc(var(--safe-top)+48px)] pb-[calc(var(--safe-bottom)+20px)] duration-300 fade-in motion-reduce:animate-none">
        <p className="text-[14.5px] text-kbc-muted">Call ended</p>
        <h2 className="mt-1 text-[24px] leading-[1.25] font-extrabold text-kbc-navy">Check it with the real {contact?.name.split(' ')[0] ?? 'caller'}</h2>
        <p className="mt-2 text-[15.5px] leading-[1.45] text-kbc-navy">
          No money was sent. Call {contact?.name ?? 'your colleague'} back on the number KBC verified for {business.name}.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {contact && <VerifiedContactButton name={contact.name} phone={contact.phone} onCall={callBack} />}
          <SecondaryAction onClick={() => void report()} disabled={reported}>
            {reported ? 'Reported · KBC customers are warned' : `Report ${callerNumber}`}
          </SecondaryAction>
        </div>
        <div className="flex-1" />
        <button type="button" onClick={close} className="h-[48px] w-full rounded-full text-[17px] font-semibold text-kbc-link">
          Done
        </button>
      </div>
    )
  }

  return (
    <div
      role="dialog"
      aria-label={`Incoming video call from ${business.ceo}`}
      className="absolute inset-0 z-[90] flex animate-in flex-col overflow-hidden bg-kbc-navy text-white duration-300 fade-in motion-reduce:animate-none"
    >
      {stage === 'live' && <CallerVideo flagged={heard} />}

      {/* KBC Trust banner, shown like a system notification on top of the call. */}
      <div className="relative z-10 px-3 pt-[calc(var(--safe-top)+8px)]">
        <div className="flex items-center gap-3 rounded-[16px] bg-white px-3 py-[10px] text-kbc-navy shadow-[0_12px_32px_rgba(0,0,0,0.25)]">
          {!callsOn ? (
            <ShieldOff className="size-[24px] shrink-0 text-kbc-muted" strokeWidth={1.8} />
          ) : trust ? (
            <ShieldX className="size-[26px] shrink-0 text-kbc-danger" strokeWidth={1.8} />
          ) : (
            <LoaderCircle className="size-[24px] shrink-0 animate-spin text-kbc-blue" strokeWidth={2} />
          )}
          <p className="min-w-0 flex-1 text-[14px] leading-[1.3]">
            <span className="block text-[12px] font-bold text-kbc-muted">KBC Trust</span>
            <span className="block font-bold">
              {!callsOn
                ? 'Caller checks are off'
                : trust
                  ? trust.headline
                  : failed
                    ? 'Could not check this caller'
                    : 'Checking this caller'}
            </span>
            {!callsOn && <span className="block text-[12.5px] text-kbc-muted">You chose not to share call signals</span>}
          </p>
          {!callsOn && (
            <button
              type="button"
              onClick={turnOnChecks}
              className="h-[36px] shrink-0 rounded-full border-[1.5px] border-kbc-blue px-3 text-[14px] font-semibold text-kbc-link"
            >
              Check now
            </button>
          )}
          {trust && (
            <span className="shrink-0 rounded-full bg-kbc-danger-bg px-[10px] py-[3px] text-[14px] font-extrabold text-kbc-danger tabular-nums">
              {trust.score}
            </span>
          )}
        </div>
      </div>

      {stage === 'ringing' ? (
        <>
          <div className="relative z-10 flex flex-1 flex-col items-center pt-16 text-center">
            <span className="grid size-[96px] place-items-center rounded-full bg-white/12 text-[34px] font-bold">PC</span>
            <p className="mt-5 text-[30px] font-semibold tracking-[-0.01em]">{business.ceo}</p>
            <p className="mt-1 text-[16px] text-white/75">CEO, {business.name}</p>
            <p className="mt-1 text-[15px] text-white/75 tabular-nums">Video call · {callerNumber}</p>
          </div>
          <div className="relative z-10 flex justify-around px-10 pb-[calc(var(--safe-bottom)+44px)]">
            <CallButton label="Decline" tone="decline" onClick={() => setStage('ended')} />
            <CallButton label="Accept" tone="accept" onClick={() => setStage('live')} />
          </div>
        </>
      ) : (
        <>
          <div className="flex-1" />
          {heard && (
            <p className="relative z-10 mx-4 mb-3 animate-in rounded-[12px] bg-kbc-navy/80 px-4 py-3 text-[15px] leading-[1.45] duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
              <span className="block text-[12px] font-bold text-white/70">{business.ceo} (claimed)</span>
              {request}
            </p>
          )}
          {showVerdict && trust ? (
            <div className="relative z-10 max-h-[62%] animate-in overflow-y-auto rounded-t-[20px] bg-white px-4 pt-4 pb-[calc(var(--safe-bottom)+16px)] text-kbc-navy duration-300 ease-out slide-in-from-bottom motion-reduce:animate-none">
              <TrustVerdict
                result={trust}
                actions={
                  <button
                    type="button"
                    onClick={() => setStage('ended')}
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-kbc-blue px-4 text-[16px] font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
                  >
                    <PhoneOff className="size-[20px]" strokeWidth={1.8} />
                    Hang up and call {contact?.name.split(' ')[0] ?? 'back'}
                  </button>
                }
              />
            </div>
          ) : (
            <div className="relative z-10 flex justify-center pb-[calc(var(--safe-bottom)+44px)]">
              <CallButton label="End call" tone="decline" onClick={() => setStage('ended')} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CallButton({ label, tone, onClick }: { label: string; tone: 'accept' | 'decline'; onClick: () => void }) {
  const Icon = tone === 'accept' ? Phone : PhoneOff
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2">
      <span
        className={cn(
          'grid size-[72px] place-items-center rounded-full text-white transition-transform duration-150 active:scale-95',
          tone === 'accept' ? 'bg-kbc-green' : 'bg-kbc-danger',
        )}
      >
        <Icon className="size-[30px]" strokeWidth={1.6} />
      </span>
      <span className="text-[14px]">{label}</span>
    </button>
  )
}

/** Stylised caller video with the regions where the (simulated) deepfake detector found artefacts. */
function CallerVideo({ flagged }: { flagged: boolean }) {
  return (
    <div aria-hidden className="absolute inset-0 bg-[#1d3a63]">
      <svg viewBox="0 0 390 640" className="absolute inset-x-0 top-[90px] w-full" fill="none">
        <path d="M163 330h64v50h-64z" fill="#355580" />
        <path d="M30 640c6-150 76-262 165-262s159 112 165 262z" fill="#3c5d88" />
        <ellipse cx="195" cy="238" rx="88" ry="110" fill="#45679a" />
        {flagged && (
          <g className="animate-in duration-500 fade-in">
            <rect x="140" y="280" width="110" height="56" rx="8" stroke="#ff9b8f" strokeWidth="2.5" strokeDasharray="7 6" />
            <path d="M110 300c4 40 30 70 85 74 55-4 81-34 85-74" stroke="#ff9b8f" strokeWidth="2.5" strokeDasharray="7 6" />
            <text x="258" y="300" fill="#ffd9d4" fontSize="15" fontWeight="700">Lip sync off</text>
            <text x="258" y="318" fill="#ffd9d4" fontSize="15">by 180 ms</text>
            <text x="22" y="380" fill="#ffd9d4" fontSize="15" fontWeight="700">Face-swap edges</text>
          </g>
        )}
      </svg>
      <span className="absolute top-[calc(var(--safe-top)+86px)] right-4 h-[120px] w-[84px] rounded-[12px] border border-white/30 bg-[#2a4a75]" />
    </div>
  )
}
