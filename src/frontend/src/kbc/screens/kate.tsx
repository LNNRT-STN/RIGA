import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowUp, ChevronRight, FileText, LockKeyhole, Mic, Paperclip, Phone, ShieldCheck, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { customer } from '../data'
import { getKateReply, kateSuggestions, type KateAction } from '../kate'
import { useApp } from '../store'
import { CircleButton, KateMark } from '../ui'
import { checkInvoice, checkWebsite, demoDocuments, reportScam, type TrustResult } from '../trust/api'
import { CheckingSteps, SecondaryAction, TrustVerdict, VerifiedContactButton } from '../trust/components'
import { dataTypes, dataUse } from '../trust/controls'

type DocumentSource = { sample: string } | { file: File }

type Message =
  | { id: number; from: 'user'; text: string; file?: string }
  | {
      id: number
      from: 'kate'
      text?: string
      actions?: KateAction[]
      /** Written by the LLM, so it carries the "Answer written by AI" label. */
      ai?: boolean
      checking?: TrustResult['subject']
      trust?: TrustResult
      /** Document checks are off, so Kate asks before she opens this file. */
      consent?: DocumentSource
    }

type Consent = 'once' | 'always' | 'no'

const documentName = (source: DocumentSource) => ('sample' in source ? source.sample : source.file.name)

type NewMessage = Message extends infer M ? (M extends Message ? Omit<M, 'id'> : never) : never

// Plain domains or URLs typed into the chat, such as "proximus-betaling.be" or "https://…".
const websitePattern = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,})(?:\/\S*)?/i

/** `openDocument` checks a demo PDF as soon as Kate opens, for the presenter shortcuts. */
export function KateScreen({ prompt, attach = false, openDocument }: { prompt?: string; attach?: boolean; openDocument?: string }) {
  const { pop, popToRoot, push, accounts, showToast, trustControls, setTrustControls, logActivity } = useApp()
  // Opened with a question or a document, Kate goes straight to the answer.
  const [messages, setMessages] = useState<Message[]>(() =>
    prompt || openDocument
      ? []
      : [{ id: 0, from: 'kate', text: `Hello ${customer.firstName}. 👋 I’m Kate. Nice to see you here! How can I help you today?` }],
  )
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(attach)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentPrompt = useRef(false)
  const nextId = useRef(1)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const add = (message: NewMessage) => {
    const id = nextId.current++
    setMessages((prev) => [...prev, { ...message, id }])
    return id
  }
  const replace = (id: number, message: NewMessage) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...message, id } : m)))

  /** Shows the checking steps, then swaps them for the verdict in the same place. */
  const runCheck = async (subject: TrustResult['subject'], what: string, work: () => Promise<TrustResult>, note = '') => {
    setBusy(true)
    const id = add({ from: 'kate', checking: subject })
    try {
      const trust = await work()
      replace(id, { from: 'kate', trust })
      const { used, kept } = dataUse(subject)
      logActivity(`Checked ${what}`, `${note}Used ${used}. ${kept} Result: ${trust.headline}`)
    } catch {
      replace(id, {
        from: 'kate',
        text: 'I can’t reach KBC Trust right now, so I can’t say whether this is real. Please try again in a moment, and don’t pay until you’ve checked.',
      })
    } finally {
      setBusy(false)
    }
  }

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    setDraft('')
    add({ from: 'user', text: trimmed })
    const site = trimmed.match(websitePattern)
    if (site) {
      await runCheck('website', site[1], () => checkWebsite(site[1]))
      return
    }
    setBusy(true)
    const history = messages.flatMap((m) => (m.text ? [{ from: m.from, text: m.text }] : []))
    const reply = await getKateReply(trimmed, { accounts, history })
    setBusy(false)
    add({ from: 'kate', ...reply })
  }

  const sendDocument = (source: DocumentSource) => {
    setSheetOpen(false)
    add({ from: 'user', text: 'Is this invoice real?', file: documentName(source) })
    if (!trustControls.data.documents) {
      add({ from: 'kate', consent: source })
      return
    }
    void runCheck('invoice', documentName(source), () => checkInvoice(source))
  }

  /** The customer's answer to "May I read this document?". Nothing is opened before they choose. */
  const answerConsent = (id: number, source: DocumentSource, choice: Consent) => {
    if (choice === 'no') {
      replace(id, { from: 'kate', text: 'OK, I haven’t opened it. Don’t pay it until you’re sure who sent it.' })
      return
    }
    if (choice === 'always') {
      setTrustControls((prev) => ({ ...prev, data: { ...prev.data, documents: true } }))
      logActivity('You switched on documents', 'KBC Trust may use your documents again.')
      replace(id, { from: 'kate', text: 'Done. I’ll check documents you share from now on. You can change this in What you share.' })
    } else {
      replace(id, { from: 'kate', text: 'I’ll read this document once, for this check only.' })
    }
    void runCheck('invoice', documentName(source), () => checkInvoice(source), choice === 'once' ? 'Allowed once by you. ' : '')
  }

  useEffect(() => {
    if (prompt && !sentPrompt.current) {
      sentPrompt.current = true
      void send(prompt)
    }
    // Send the opening prompt once; `send` is intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt])

  useEffect(() => {
    if (openDocument && !sentPrompt.current) {
      sentPrompt.current = true
      sendDocument({ sample: openDocument })
    }
    // Check the opening document once; `sendDocument` is intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDocument])

  const runAction = (action: KateAction) => {
    if (action.action === 'transfer') push({ name: 'transfer' })
    else if (action.action === 'account') push({ name: 'account', accountId: 'current' })
    else if (action.action === 'upload') setSheetOpen(true)
    else showToast('Calling KBC Live (simulated)')
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(draft)
  }

  const checking = messages.some((m) => m.from === 'kate' && m.checking)

  return (
    <div className="absolute inset-0 z-50 flex animate-in flex-col bg-white duration-300 ease-out slide-in-from-bottom-8 fade-in motion-reduce:animate-none">
      <header className="shrink-0 bg-white pt-(--safe-top)">
        <div className="flex h-[62px] items-center gap-3 px-4">
          <CircleButton label="Back" onClick={pop}>
            <ArrowLeft className="size-[22px] text-kbc-blue" strokeWidth={1.6} />
          </CircleButton>
          <h1 className="flex-1 text-center text-[19px] font-semibold text-kbc-navy">Kate</h1>
          <CircleButton label="Close Kate" onClick={popToRoot}>
            <X className="size-[22px] text-kbc-blue" strokeWidth={1.6} />
          </CircleButton>
        </div>
      </header>

      <div ref={scrollRef} className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-3">
        <div className="flex-1" />
        <p className="pt-6 pb-4 text-center text-[13.5px] text-kbc-link">Ask Kate, your AI assistant</p>
        <DataScopeLine />
        <ul className="flex flex-col gap-4" aria-live="polite">
          {messages.map((m) =>
            m.from === 'kate' ? (
              <li key={m.id} className="animate-in duration-300 fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
                <KateMark className="mb-2 size-[26px]" />
                {m.text && <p className="text-[16.5px] leading-[1.5] text-kbc-navy">{m.text}</p>}
                {m.ai && <p className="mt-1 text-[13px] text-kbc-muted">Answer written by AI</p>}
                {m.checking && <CheckingSteps subject={m.checking} />}
                {m.trust && <TrustReply result={m.trust} />}
                {m.consent && (
                  <ConsentCard onAnswer={(choice) => answerConsent(m.id, m.consent!, choice)} />
                )}
                {m.actions && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.actions.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        onClick={() => runAction(a)}
                        className="h-[38px] rounded-full bg-kbc-blue px-4 text-[15px] font-semibold text-white"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ) : (
              <li key={m.id} className="flex animate-in flex-col items-end gap-2 duration-200 fade-in motion-reduce:animate-none">
                {m.file && (
                  <span className="flex max-w-[80%] items-center gap-3 rounded-[14px] border border-kbc-line bg-white px-3 py-[10px] shadow-[0_2px_8px_rgba(20,41,77,0.06)]">
                    <span className="grid size-[36px] shrink-0 place-items-center rounded-[8px] bg-kbc-danger-bg text-[10px] font-black text-kbc-danger">
                      PDF
                    </span>
                    <span className="min-w-0 truncate text-[14.5px] text-kbc-navy">{m.file}</span>
                  </span>
                )}
                <p className="max-w-[80%] rounded-[18px] rounded-br-[6px] bg-kbc-pale px-4 py-[10px] text-[16px] leading-[1.4] text-kbc-navy">
                  {m.text}
                </p>
              </li>
            ),
          )}
          {busy && !checking && (
            <li aria-label="Kate is typing" className="flex items-center gap-[5px] pl-1">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="size-[7px] animate-bounce rounded-full bg-kbc-blue/70"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </li>
          )}
        </ul>
      </div>

      <div className="shrink-0 pb-[calc(var(--safe-bottom)+10px)]">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {kateSuggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => (i === 0 ? setSheetOpen(true) : void send(s))}
              className="flex h-[40px] shrink-0 items-center gap-2 rounded-full border-[1.5px] border-kbc-blue px-4 text-[16px] font-semibold text-kbc-link"
            >
              {i === 0 && <ShieldCheck className="size-[17px]" strokeWidth={1.8} />}
              {i === 1 && <Phone className="size-[17px]" strokeWidth={1.8} />}
              {s}
            </button>
          ))}
          <span aria-hidden className="grid size-[40px] shrink-0 place-items-center text-kbc-navy">
            <ChevronRight className="size-5" />
          </span>
        </div>
        <form onSubmit={onSubmit} className="flex items-center gap-1 pr-4 pl-2">
          <button
            type="button"
            aria-label="Add a document to check"
            onClick={() => setSheetOpen(true)}
            className="grid size-[44px] shrink-0 place-items-center rounded-full text-kbc-blue transition-colors duration-150 active:bg-kbc-pale"
          >
            <Paperclip className="size-[22px]" strokeWidth={1.7} />
          </button>
          <label className="flex h-[52px] min-w-0 flex-1 items-center rounded-full border-[1.5px] border-kbc-kate-border pr-[4px] pl-4 focus-within:border-kbc-blue">
            <span className="sr-only">Type your question</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your question here"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-kbc-navy outline-none placeholder:text-kbc-placeholder"
            />
            <button
              type={draft.trim() ? 'submit' : 'button'}
              aria-label={draft.trim() ? 'Send' : 'Speak your question'}
              onClick={draft.trim() ? undefined : () => showToast('Voice input is not available in this demo')}
              className={cn(
                'grid size-[44px] place-items-center rounded-full text-white transition-colors duration-150',
                'bg-kbc-blue',
              )}
            >
              {draft.trim() ? <ArrowUp className="size-5" strokeWidth={2} /> : <Mic className="size-5" strokeWidth={1.6} />}
            </button>
          </label>
        </form>
      </div>

      {sheetOpen && <AttachSheet onClose={() => setSheetOpen(false)} onPick={sendDocument} />}
    </div>
  )
}

/** Verdict plus the one action that fits it: call the real sender, or pay a verified invoice. */
function TrustReply({ result }: { result: TrustResult }) {
  const { push, showToast, logActivity } = useApp()
  const manageData = () => push({ name: 'trust-data' })
  const [reported, setReported] = useState(false)
  const contact = result.verifiedContact
  const iban = result.extracted?.IBAN
  const amount = result.extracted?.Amount?.replace(/[^\d.]/g, '')

  const report = async () => {
    if (!iban) return
    try {
      const { message } = await reportScam({ iban })
      setReported(true)
      showToast(message)
      logActivity('You reported an account as a scam', `Only ${iban} was shared with other KBC customers, never your name.`)
    } catch {
      showToast('Reporting is not available right now. Please try again.')
    }
  }

  const payVerified = () =>
    push({
      name: 'transfer',
      prefill: {
        fromId: 'current',
        name: contact?.name ?? result.extracted?.Sender ?? '',
        iban: iban ?? '',
        amount: amount ?? '',
        message: result.extracted?.['Invoice number'] ?? '',
      },
    })

  if (result.decision === 'allow') {
    return (
      <TrustVerdict
        result={result}
        onManageData={manageData}
        actions={
          result.subject === 'invoice' && iban && amount ? (
            <button
              type="button"
              onClick={payVerified}
              className="h-[48px] w-full rounded-full bg-kbc-blue text-[16px] font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
            >
              Pay this invoice
            </button>
          ) : undefined
        }
      />
    )
  }

  return (
    <TrustVerdict
      result={result}
      onManageData={manageData}
      actions={
        <>
          {contact && (
            <VerifiedContactButton
              name={contact.name}
              phone={contact.phone}
              onCall={() => showToast(`Calling ${contact.name} on ${contact.phone} (simulated)`)}
            />
          )}
          {iban && (
            <SecondaryAction onClick={() => void report()} disabled={reported}>
              {reported ? 'Reported · KBC customers are warned' : 'Report as scam'}
            </SecondaryAction>
          )}
        </>
      }
    />
  )
}

function AttachSheet({ onClose, onPick }: { onClose: () => void; onPick: (source: DocumentSource) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="absolute inset-0 z-[60]">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 animate-in bg-kbc-navy/45 duration-200 fade-in" />
      <div
        role="dialog"
        aria-label="Check if it’s real"
        className="absolute inset-x-0 bottom-0 animate-in rounded-t-[20px] bg-white pt-2 pb-[calc(var(--safe-bottom)+16px)] shadow-[0_-12px_32px_rgba(20,41,77,0.14)] duration-300 ease-out slide-in-from-bottom motion-reduce:animate-none"
      >
        <span aria-hidden className="mx-auto block h-[5px] w-[40px] rounded-full bg-[#d5dbe2]" />
        <h2 className="px-4 pt-4 text-[19px] font-extrabold text-kbc-navy">Check if it’s real</h2>
        <p className="px-4 pt-1 pb-3 text-[14.5px] leading-[1.4] text-kbc-muted">
          Kate reads the document once to check it with KBC Trust, then deletes it. You decide what you share.
        </p>
        <p className="px-4 pt-2 pb-1 text-[13.5px] font-bold text-kbc-navy">Recent documents</p>
        {demoDocuments.map((doc) => (
          <button
            key={doc.file}
            type="button"
            onClick={() => onPick({ sample: doc.file })}
            className="flex min-h-[60px] w-full items-center gap-3 px-4 text-left transition-colors duration-150 active:bg-kbc-pale"
          >
            <span className="grid size-[40px] shrink-0 place-items-center rounded-[8px] bg-kbc-pale text-kbc-navy">
              <FileText className="size-[22px]" strokeWidth={1.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] text-kbc-navy">{doc.title}</span>
              <span className="block text-[13px] text-kbc-muted">{doc.detail}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-kbc-navy" strokeWidth={1.5} />
          </button>
        ))}
        <div className="px-4 pt-3">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onPick({ file })
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-[48px] w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-kbc-blue text-[16px] font-semibold text-kbc-link"
          >
            <Upload className="size-[18px]" strokeWidth={1.8} />
            Choose a PDF
          </button>
        </div>
      </div>
    </div>
  )
}

/** Always visible under Kate's greeting: what she may use, one tap from changing it. */
function DataScopeLine() {
  const { trustControls, push } = useApp()
  const allowed = dataTypes.filter((d) => trustControls.data[d.key]).map((d) => d.short)
  // Only worth a line when the customer limited what Kate may use.
  if (allowed.length === dataTypes.length) return null
  const list =
    allowed.length === 0
      ? 'Kate uses only what you type'
      : `Kate may check your ${allowed.length > 1 ? `${allowed.slice(0, -1).join(', ')} and ${allowed.at(-1)}` : allowed[0]}`
  return (
    <p className="pb-6 text-center">
      <button
        type="button"
        onClick={() => push({ name: 'trust-data' })}
        className="inline-flex min-h-[32px] items-center gap-[6px] rounded-full bg-kbc-pale px-3 text-[13px] text-kbc-navy transition-colors duration-150 active:bg-kbc-surface-blue"
      >
        <LockKeyhole className="size-[14px] shrink-0 text-kbc-blue" strokeWidth={2} />
        {list}
        <span className="font-semibold text-kbc-link">Change</span>
      </button>
    </p>
  )
}

/** Kate asks before she opens a document when the customer switched document checks off. */
function ConsentCard({ onAnswer }: { onAnswer: (choice: Consent) => void }) {
  return (
    <div className="rounded-[12px] bg-kbc-pale px-4 py-3">
      <p className="flex items-center gap-2 text-[14.5px] font-bold text-kbc-navy">
        <LockKeyhole className="size-[18px] text-kbc-blue" strokeWidth={1.8} />
        May I read this document?
      </p>
      <p className="mt-1 text-[15px] leading-[1.45] text-kbc-navy">
        You switched off document checks. If you allow it, I read it once and delete it after.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onAnswer('once')}
          className="h-[48px] w-full rounded-full bg-kbc-blue text-[16px] font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
        >
          Check this one only
        </button>
        <SecondaryAction onClick={() => onAnswer('always')}>Always allow documents</SecondaryAction>
        <button type="button" onClick={() => onAnswer('no')} className="h-[44px] w-full text-[15.5px] font-semibold text-kbc-link">
          Not now
        </button>
      </div>
    </div>
  )
}
