import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowUp, ChevronRight, FileText, Mic, Paperclip, Phone, ShieldCheck, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { customer } from '../data'
import { getKateReply, kateSuggestions, type KateAction } from '../kate'
import { useApp } from '../store'
import { CircleButton, KateMark } from '../ui'
import { checkInvoice, checkWebsite, demoDocuments, reportScam, type TrustResult } from '../trust/api'
import { CheckingSteps, SecondaryAction, TrustVerdict, VerifiedContactButton } from '../trust/components'

type Message =
  | { id: number; from: 'user'; text: string; file?: string }
  | {
      id: number
      from: 'kate'
      text?: string
      actions?: KateAction[]
      checking?: TrustResult['subject']
      trust?: TrustResult
    }

type NewMessage = Message extends infer M ? (M extends Message ? Omit<M, 'id'> : never) : never

// Plain domains or URLs typed into the chat, such as "proximus-betaling.be" or "https://…".
const websitePattern = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,})(?:\/\S*)?/i

export function KateScreen({ prompt, attach = false }: { prompt?: string; attach?: boolean }) {
  const { pop, popToRoot, push, accounts, showToast } = useApp()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: 'kate',
      text: `Hello ${customer.firstName}. 👋 I’m Kate. Nice to see you here! How can I help you today?`,
    },
  ])
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
  const runCheck = async (subject: TrustResult['subject'], work: () => Promise<TrustResult>) => {
    setBusy(true)
    const id = add({ from: 'kate', checking: subject })
    try {
      const trust = await work()
      replace(id, { from: 'kate', trust })
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
      await runCheck('website', () => checkWebsite(site[1]))
      return
    }
    setBusy(true)
    const reply = await getKateReply(trimmed, { accounts })
    setBusy(false)
    add({ from: 'kate', ...reply })
  }

  const sendDocument = (source: { sample: string } | { file: File }) => {
    setSheetOpen(false)
    const name = 'sample' in source ? source.sample : source.file.name
    add({ from: 'user', text: 'Is this invoice real?', file: name })
    void runCheck('invoice', () => checkInvoice(source))
  }

  useEffect(() => {
    if (prompt && !sentPrompt.current) {
      sentPrompt.current = true
      void send(prompt)
    }
    // Send the opening prompt once; `send` is intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt])

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
        <p className="pt-6 text-center text-[13.5px] font-semibold text-kbc-navy">Today</p>
        <p className="pb-6 text-center text-[13.5px] text-kbc-link">Ask Kate, your AI assistant</p>
        <ul className="flex flex-col gap-4" aria-live="polite">
          {messages.map((m) =>
            m.from === 'kate' ? (
              <li key={m.id} className="animate-in duration-300 fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
                <KateMark className="mb-2 size-[26px]" />
                {m.text && <p className="text-[16.5px] leading-[1.5] text-kbc-navy">{m.text}</p>}
                {m.checking && <CheckingSteps subject={m.checking} />}
                {m.trust && <TrustReply result={m.trust} />}
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
  const { push, showToast } = useApp()
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

function AttachSheet({ onClose, onPick }: { onClose: () => void; onPick: (source: { sample: string } | { file: File }) => void }) {
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
          Kate reads the document and checks it with KBC Trust. You decide what you share.
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
