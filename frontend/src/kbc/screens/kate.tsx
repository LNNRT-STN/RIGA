import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowUp, ChevronRight, Mic, Phone, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { customer } from '../data'
import { getKateReply, kateSuggestions, type KateAction } from '../kate'
import { useApp } from '../store'
import { CircleButton, KateMark } from '../ui'

type Message = { id: number; from: 'kate' | 'user'; text: string; actions?: KateAction[] }

export function KateScreen({ prompt }: { prompt?: string }) {
  const { pop, popToRoot, push, accounts, showToast } = useApp()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: 'kate',
      text: `Hello ${customer.firstName}. 👋 I’m Kate. Nice to see you here! How can I help you today?`,
    },
  ])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentPrompt = useRef(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || typing) return
    setDraft('')
    setMessages((prev) => [...prev, { id: prev.length, from: 'user', text: trimmed }])
    setTyping(true)
    const reply = await getKateReply(trimmed, { accounts })
    setTyping(false)
    setMessages((prev) => [...prev, { id: prev.length, from: 'kate', ...reply }])
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
    else showToast('Calling KBC Live (simulated)')
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(draft)
  }

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
              <li key={m.id} className="animate-in duration-300 fade-in slide-in-from-bottom-1">
                <KateMark className="mb-2 size-[26px]" />
                <p className="text-[16.5px] leading-[1.5] text-kbc-navy">{m.text}</p>
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
              <li key={m.id} className="flex animate-in justify-end duration-200 fade-in">
                <p className="max-w-[80%] rounded-[18px] rounded-br-[6px] bg-kbc-pale px-4 py-[10px] text-[16px] leading-[1.4] text-kbc-navy">
                  {m.text}
                </p>
              </li>
            ),
          )}
          {typing && (
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
              onClick={() => void send(s)}
              className="flex h-[40px] shrink-0 items-center gap-2 rounded-full border-[1.5px] border-kbc-blue px-4 text-[16px] font-semibold text-kbc-link"
            >
              {i === 0 && <Phone className="size-[17px]" strokeWidth={1.8} />}
              {s}
            </button>
          ))}
          <span aria-hidden className="grid size-[40px] shrink-0 place-items-center text-kbc-navy">
            <ChevronRight className="size-5" />
          </span>
        </div>
        <form onSubmit={onSubmit} className="px-4">
          <label className="flex h-[52px] items-center rounded-full border-[1.5px] border-[#c8def2] pr-[4px] pl-4 focus-within:border-kbc-blue">
            <span className="sr-only">Type your question</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your question here"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-kbc-navy outline-none placeholder:text-[#7586a0]"
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
    </div>
  )
}
