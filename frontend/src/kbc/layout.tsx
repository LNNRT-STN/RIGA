import { useState, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from './store'
import { CircleButton, TabHeader } from './ui'

/** Scroll container for one of the four main tabs, with the shared header. */
export function TabPage({
  title,
  katePrompt,
  className,
  children,
}: {
  title?: string
  katePrompt?: string
  className?: string
  children: ReactNode
}) {
  const [scrolled, setScrolled] = useState(false)
  return (
    <div className="absolute inset-0">
      <TabHeader title={title} katePrompt={katePrompt} scrolled={scrolled} />
      <div
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 6)}
        className={cn(
          'no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain pt-[calc(var(--safe-top)+62px)] pb-[140px]',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** Full-screen page pushed on top of the tabs, sliding in from the right. */
export function PushedPage({
  title,
  trailing,
  children,
  className,
  onBack,
}: {
  title: string
  trailing?: ReactNode
  children: ReactNode
  className?: string
  onBack?: () => void
}) {
  const { pop } = useApp()
  return (
    <div className="absolute inset-0 z-50 flex animate-in flex-col bg-white duration-300 ease-out slide-in-from-right motion-reduce:animate-none">
      <header className="relative z-10 shrink-0 bg-white pt-(--safe-top)">
        <div className="flex h-[62px] items-center gap-3 px-4">
          <CircleButton label="Back" onClick={onBack ?? pop}>
            <ArrowLeft className="size-[22px] text-kbc-blue" strokeWidth={1.6} />
          </CircleButton>
          <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold text-kbc-navy">{title}</h1>
          <div className="flex min-w-[46px] justify-end gap-2">{trailing}</div>
        </div>
      </header>
      <div className={cn('no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain', className)}>{children}</div>
    </div>
  )
}
