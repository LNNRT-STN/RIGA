import { useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, Eye, Play, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KbcWordmark } from '@/kbc/ui'
import { tourSteps, type TourContext } from './steps'

// Steps between the welcome and the finish, the ones the progress bar counts.
const storySteps = tourSteps.filter((s) => s.chapter)
const chapters = [...new Set(storySteps.map((s) => s.chapter!))]

type Props = {
  index: number
  onIndex: (index: number) => void
  onClose: () => void
  context: Omit<TourContext, 'later' | 'current'>
  /** Below 1024px the card sits over the bottom of the screen; this reports how much room it takes. */
  onCardHeight: (height: number) => void
}

/**
 * A guided tour next to the phone: one short caption per step, and the tour drives the app so the
 * visitor only presses Next. Below 1024px it becomes a card at the bottom of the screen.
 */
export function GuidedTour({ index, onIndex, onClose, context, onCardHeight }: Props) {
  const step = tourSteps[index]
  const cardRef = useRef<HTMLElement>(null)
  const reportHeight = useRef(onCardHeight)
  useEffect(() => {
    reportHeight.current = onCardHeight
  })

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const report = () => {
      const floating = getComputedStyle(card).position === 'fixed'
      reportHeight.current(floating ? Math.ceil(card.getBoundingClientRect().height) + 12 : 0)
    }
    const observer = new ResizeObserver(report)
    observer.observe(card)
    window.addEventListener('resize', report)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', report)
      reportHeight.current(0)
    }
  }, [])
  const timers = useRef<number[]>([])
  const contextRef = useRef(context)
  useEffect(() => {
    contextRef.current = context
  })

  useEffect(() => {
    const later = (ms: number, run: () => void) => {
      timers.current.push(window.setTimeout(run, ms))
    }
    let active = true
    void step.enter({ ...contextRef.current, later, current: () => active })
    return () => {
      active = false
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current = []
    }
  }, [step])

  const isFirst = index === 0
  const isLast = index === tourSteps.length - 1
  const next = () => !isLast && onIndex(index + 1)
  const back = () => !isFirst && onIndex(index - 1)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const storyIndex = storySteps.indexOf(step)

  return (
    <section
      ref={cardRef}
      aria-label="Guided tour"
      className={cn(
        'kbc z-[100] flex flex-col bg-white text-kbc-navy shadow-[0_12px_32px_rgba(0,59,113,0.14)]',
        // Small screens: a card over the bottom of the screen. Large screens: a column next to the phone.
        'fixed inset-x-3 bottom-3 mx-auto min-h-[228px] max-w-[480px] rounded-[16px] p-4 sm:inset-x-4 sm:bottom-4 sm:min-h-[300px] sm:p-5',
        'lg:static lg:mx-0 lg:min-h-[540px] lg:w-[320px] xl:w-[360px] lg:max-w-none lg:shrink-0 lg:self-center lg:rounded-[20px] lg:p-7',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-baseline gap-[6px] text-[14px] font-bold text-kbc-muted">
          <KbcWordmark className="text-[15px] text-kbc-navy" />
          Trust tour
        </p>
        {!isLast && (
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex min-h-[44px] items-center gap-1 rounded-full px-3 text-[14px] font-semibold text-kbc-link transition-colors duration-150 hover:bg-kbc-pale"
          >
            {isFirst ? 'Skip' : 'Exit tour'}
            <X className="size-[16px]" strokeWidth={2} />
          </button>
        )}
      </div>

      <div
        key={step.id}
        aria-live="polite"
        className="mt-2 animate-in duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] fade-in slide-in-from-bottom-2 motion-reduce:animate-none lg:mt-4"
      >
        <h2
          className={cn(
            'font-extrabold tracking-[-0.015em] text-balance',
            isFirst || isLast ? 'text-[26px] leading-[1.15] sm:text-[30px] lg:text-[38px]' : 'text-[20px] leading-[1.2] sm:text-[22px] lg:text-[26px]',
          )}
        >
          {step.title}
        </h2>
        <p className="mt-2 text-[15px] leading-[1.5] text-pretty sm:text-[16px] lg:mt-3 lg:text-[16.5px]">{step.body}</p>
        {step.look && (
          <p className="mt-3 hidden items-start gap-2 rounded-[12px] bg-kbc-surface-blue px-3 py-[10px] text-[14.5px] leading-[1.45] sm:flex lg:mt-4">
            <Eye className="mt-[2px] size-[17px] shrink-0 text-kbc-blue" strokeWidth={1.8} />
            <span>{step.look}</span>
          </p>
        )}
        {step.note && <p className="mt-2 text-[13px] leading-[1.4] text-kbc-muted">{step.note}</p>}
        {isFirst && (
          <p className="mt-3 text-[14px] text-kbc-muted lg:mt-4">
            {storySteps.length} short steps, about 3 minutes. Press Next, the tour does the tapping.
          </p>
        )}
        {isLast && <p className="mt-3 text-[13px] leading-[1.4] text-kbc-muted">All people, companies and amounts are fictional. Transfers are simulated.</p>}
      </div>

      {/* Controls sit at the bottom of a fixed-height card, so Next stays under the pointer on every step. */}
      {isFirst ? (
        <div className="mt-auto flex flex-col gap-2 pt-4 lg:pt-7">
          <PrimaryButton onClick={next}>
            <Play className="size-[17px] fill-current" strokeWidth={0} />
            Start the tour
          </PrimaryButton>
        </div>
      ) : isLast ? (
        <div className="mt-auto flex flex-col gap-2 pt-4 lg:pt-7">
          <PrimaryButton onClick={onClose}>Explore on my own</PrimaryButton>
          <button
            type="button"
            onClick={() => onIndex(1)}
            className="min-h-[44px] rounded-full text-[15.5px] font-semibold text-kbc-link transition-colors duration-150 hover:bg-kbc-pale"
          >
            Watch it again
          </button>
        </div>
      ) : (
        <div className="mt-auto pt-4 lg:pt-7">
          <p className="flex items-baseline justify-between gap-3 text-[13px] leading-[1.3]">
            <span className="min-w-0 font-bold">{step.chapter}</span>
            <span className="shrink-0 text-kbc-muted tabular-nums">
              {storyIndex + 1} of {storySteps.length}
            </span>
          </p>
          <Progress current={storyIndex} />
          <div className="mt-3 flex items-center gap-3 lg:mt-4">
            <button
              type="button"
              onClick={back}
              aria-label="Previous step"
              className="grid size-[48px] shrink-0 place-items-center rounded-full border-[1.5px] border-kbc-blue text-kbc-link transition-colors duration-150 hover:bg-kbc-pale"
            >
              <ArrowLeft className="size-[20px]" strokeWidth={1.8} />
            </button>
            <PrimaryButton onClick={next} className="flex-1" ariaKeyshortcuts="ArrowRight">
              Next
              <ArrowRight className="size-[18px]" strokeWidth={2} />
            </PrimaryButton>
          </div>
          <p className="mt-3 hidden text-[12.5px] text-kbc-muted lg:block">
            Use the <Key>←</Key> and <Key>→</Key> keys to move through the tour.
          </p>
        </div>
      )}
    </section>
  )
}

/** One segment per step, with a wider gap between chapters, so the visitor sees how much is left. */
function Progress({ current }: { current: number }) {
  return (
    <div aria-hidden className="mt-2 flex gap-2">
      {chapters.map((chapter) => (
        <div key={chapter} className="flex flex-1 gap-[3px]">
          {storySteps.map((s, i) =>
            s.chapter === chapter ? (
              <span
                key={s.id}
                className={cn(
                  'h-[4px] flex-1 rounded-full transition-colors duration-300',
                  i < current ? 'bg-kbc-blue' : i === current ? 'bg-kbc-navy' : 'bg-kbc-line',
                )}
              />
            ) : null,
          )}
        </div>
      ))}
    </div>
  )
}

function PrimaryButton({
  children,
  onClick,
  className,
  ariaKeyshortcuts,
}: {
  children: React.ReactNode
  onClick: () => void
  className?: string
  ariaKeyshortcuts?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-keyshortcuts={ariaKeyshortcuts}
      className={cn(
        'flex h-[48px] w-full shrink-0 items-center justify-center gap-2 rounded-full bg-kbc-blue text-[16px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-kbc-link active:scale-[0.98]',
        className,
      )}
    >
      {children}
    </button>
  )
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-[2px] inline-grid h-[20px] min-w-[20px] place-items-center rounded-[5px] border border-kbc-line bg-white px-1 font-sans text-[12px] font-bold text-kbc-navy">
      {children}
    </kbd>
  )
}

/** Brings the tour back after it was closed. */
export function TourButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="kbc fixed bottom-4 left-4 z-[100] hidden min-h-[44px] items-center gap-2 rounded-full bg-white px-4 text-[14.5px] font-semibold text-kbc-link shadow-[0_2px_8px_rgba(0,59,113,0.12)] transition-colors duration-150 hover:bg-kbc-pale sm:flex"
    >
      <Play className="size-[15px] fill-current" strokeWidth={0} />
      Guided tour
    </button>
  )
}
