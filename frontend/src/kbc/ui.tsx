import type { ComponentProps, ReactNode } from 'react'
import { Bell, ChevronRight, Layers, List, PiggyBank, Search, Settings, Wallet, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { splitAmount } from './format'
import { useApp, type Tab } from './store'

/** Kate assistant symbol: a neutral stand-in until the team supplies the official Kate asset. */
export function KateMark({ className, plain = false }: { className?: string; plain?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8 shrink-0', className)} aria-hidden>
      {!plain && <circle cx="16" cy="16" r="15" fill="#eef7fd" stroke="#bfe0f6" strokeWidth="1.5" />}
      <g stroke="#3b8fd3" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M12.5 11h7" />
        <path d="M9 16h14" />
        <path d="M12.5 21h7" />
      </g>
      <circle cx="16" cy="7.6" r="1.3" fill="#3b8fd3" />
      <circle cx="16" cy="24.4" r="1.3" fill="#3b8fd3" />
    </svg>
  )
}

/** Text wordmark. Do not replace with a drawn logo unless the official asset is supplied. */
export function KbcWordmark({ className }: { className?: string }) {
  return <span className={cn('font-black tracking-[0.06em]', className)}>KBC</span>
}

export function Amount({
  value,
  currency = 'EUR',
  className,
  showPlus = false,
}: {
  value: number
  currency?: string
  className?: string
  showPlus?: boolean
}) {
  const { hideAmounts } = useApp()
  if (hideAmounts) {
    return (
      <span className={cn('whitespace-nowrap tabular-nums', className)}>
        <span aria-label="Amount hidden">•••</span>
        <span className="text-[0.72em]"> {currency}</span>
      </span>
    )
  }
  const { sign, whole, decimals } = splitAmount(value)
  return (
    <span className={cn('whitespace-nowrap tabular-nums', className)}>
      {sign || (showPlus && value > 0 ? '+' : '')}
      {whole}
      <span className="text-[0.72em]">
        {decimals} {currency}
      </span>
    </span>
  )
}

export function CircleButton({
  label,
  badge = false,
  className,
  children,
  ...props
}: ComponentProps<'button'> & { label: string; badge?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'relative grid size-[46px] shrink-0 place-items-center rounded-full border border-[#edf1f5] bg-white text-kbc-navy shadow-[0_3px_8px_rgba(20,41,77,0.12)] transition-transform duration-150 active:scale-95',
        className,
      )}
      {...props}
    >
      {children}
      {badge && <span className="absolute top-[7px] right-[7px] size-[11px] rounded-full bg-kbc-red ring-2 ring-white" />}
    </button>
  )
}

export function KatePill({ placeholder = 'How can I help?', onClick }: { placeholder?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[40px] min-w-0 flex-1 items-center gap-2 rounded-full border-[1.5px] border-[#c8def2] bg-white pr-3 pl-3 text-left transition-colors duration-150 active:bg-kbc-pale"
    >
      <Search className="size-[18px] shrink-0 text-[#7d8ca3]" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate text-[15.5px] text-[#76869c]">{placeholder}</span>
      <span className="flex items-center gap-1">
        <KateMark className="size-[16px]" />
        <span className="text-[16px] font-extrabold tracking-[-0.01em] text-kbc-navy">Kate</span>
      </span>
    </button>
  )
}

/**
 * Header for the four main tabs. With a title it shows the large page title and swaps to the
 * Kate search pill once the page scrolls, like KBC Mobile does.
 */
export function TabHeader({ title, scrolled, katePrompt }: { title?: string; scrolled: boolean; katePrompt?: string }) {
  const { push } = useApp()
  const openKate = () => push({ name: 'kate' })
  const showPill = !title || scrolled

  return (
    <header
      className={cn(
        'absolute inset-x-0 top-0 z-30 bg-white pt-(--safe-top) transition-shadow duration-200',
        scrolled && 'shadow-[0_4px_14px_rgba(20,41,77,0.09)]',
      )}
    >
      <div className="flex h-[62px] items-center gap-[10px] px-4">
        <CircleButton label="Settings and more" onClick={() => push({ name: 'settings' })}>
          <Settings className="size-[21px]" strokeWidth={1.6} />
        </CircleButton>
        {showPill ? (
          <KatePill placeholder={title ? katePrompt : 'How can I help?'} onClick={openKate} />
        ) : (
          <h1 className="min-w-0 flex-1 animate-in truncate text-[28px] leading-none font-extrabold tracking-[-0.015em] text-kbc-navy duration-200 fade-in">
            {title}
          </h1>
        )}
        {(!title || !scrolled) && (
          <CircleButton label="Notifications, 1 new" badge onClick={() => push({ name: 'messages' })}>
            <Bell className="size-[21px]" strokeWidth={1.6} />
          </CircleButton>
        )}
        {title && !scrolled && (
          <CircleButton label="Ask Kate" onClick={openKate}>
            <KateMark className="size-[24px]" plain />
          </CircleButton>
        )}
      </div>
    </header>
  )
}

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: Wallet },
  { id: 'mykbc', label: 'My KBC', icon: List },
  { id: 'invest', label: 'Invest', icon: PiggyBank },
  { id: 'offers', label: 'Offers', icon: Layers },
]

export function TabBar() {
  const { tab, setTab } = useApp()
  return (
    <nav
      aria-label="Main"
      className="absolute inset-x-[20px] bottom-[max(14px,calc(var(--safe-bottom)-10px))] z-40 flex h-[64px] items-center rounded-full border border-white/70 bg-white/80 p-[5px] shadow-[0_8px_24px_rgba(20,41,77,0.14),inset_0_0_0_1px_rgba(20,41,77,0.05)] backdrop-blur-xl backdrop-saturate-150"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = tab === id
        return (
          <button
            key={id}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => setTab(id)}
            className={cn(
              'flex h-full flex-1 flex-col items-center justify-center gap-[3px] rounded-full text-kbc-ink transition-colors duration-200',
              active && 'bg-[#e4e8ec]',
            )}
          >
            <Icon
              className="size-[23px]"
              strokeWidth={active ? 2 : 1.6}
              fill={active ? 'currentColor' : 'none'}
              fillOpacity={active ? 0.92 : 0}
              stroke={active && id !== 'mykbc' ? '#e4e8ec' : 'currentColor'}
            />
            <span className={cn('text-[11.5px] leading-none', active ? 'font-bold' : 'font-semibold')}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function SectionHeader({
  title,
  action,
  onAction,
  strong = false,
  className,
}: {
  title: string
  action?: string
  onAction?: () => void
  strong?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 px-4 pt-9 pb-[14px]', className)}>
      <h2
        className={cn(
          'text-kbc-navy',
          strong ? 'text-[19px] font-extrabold tracking-[-0.01em]' : 'text-[17.5px] font-semibold',
        )}
      >
        {title}
      </h2>
      {action && (
        <button type="button" onClick={onAction} className="shrink-0 text-[14.5px] font-bold text-kbc-link">
          {action}
        </button>
      )}
    </div>
  )
}

export function Card({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('rounded-[12px] bg-white shadow-[0_2px_10px_rgba(20,41,77,0.07)]', className)} {...props}>
      {children}
    </div>
  )
}

export function PillButton({
  variant = 'solid',
  tone = 'blue',
  className,
  children,
  ...props
}: ComponentProps<'button'> & { variant?: 'solid' | 'outline'; tone?: 'blue' | 'green' | 'white' }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-[32px] items-center rounded-full px-4 text-[15.5px] font-semibold whitespace-nowrap transition-[transform,background-color] duration-150 active:scale-[0.97]',
        variant === 'solid' && tone === 'blue' && 'bg-kbc-blue text-white active:bg-kbc-link',
        variant === 'outline' && tone === 'blue' && 'border-[1.5px] border-kbc-blue bg-white text-kbc-link',
        variant === 'outline' && tone === 'green' && 'border-[1.5px] border-kbc-green bg-white text-kbc-green',
        variant === 'outline' && tone === 'white' && 'border-[1.5px] border-white text-white',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Stand-in artwork for photo slots. Pass `image` (a file in /public) to use real campaign photos.
 */
export function Artwork({
  icon: Icon,
  image,
  tint = 'blue',
  className,
}: {
  icon: LucideIcon
  image?: string
  tint?: 'blue' | 'green' | 'sand' | 'navy'
  className?: string
}) {
  if (image) return <img src={image} alt="" className={cn('object-cover', className)} />
  const tints = {
    blue: 'from-[#cfe8f8] via-[#a6d3f1] to-[#5fb0e6] text-white',
    green: 'from-[#e3f4dc] via-[#b9e2a6] to-[#74bf4f] text-white',
    sand: 'from-[#f6ecd9] via-[#e9cfa3] to-[#c99a5b] text-white',
    navy: 'from-[#4d84b7] via-[#2f5f93] to-[#1d3f6b] text-white/90',
  }
  return (
    <div aria-hidden className={cn('relative grid place-items-center overflow-hidden bg-gradient-to-br', tints[tint], className)}>
      <div className="absolute -right-6 -bottom-8 size-28 rounded-full bg-white/15" />
      <div className="absolute -top-10 -left-8 size-24 rounded-full bg-white/10" />
      <Icon className="relative size-[44px] drop-shadow-[0_2px_4px_rgba(20,41,77,0.18)]" strokeWidth={1.4} />
    </div>
  )
}

export function PromoCard({
  text,
  cta,
  icon,
  image,
  tint,
  onClick,
  pale = true,
  title,
}: {
  text: string
  cta: string
  icon: LucideIcon
  image?: string
  tint?: 'blue' | 'green' | 'sand' | 'navy'
  onClick?: () => void
  pale?: boolean
  title?: string
}) {
  return (
    <div className="px-4">
      <Card className={cn('flex min-h-[146px] overflow-hidden', pale && 'bg-[#eff7fc] shadow-none')}>
        <div className="flex flex-1 flex-col justify-between gap-4 py-[18px] pr-2 pl-4">
          <div>
            {title && <p className="mb-1 text-[17px] font-extrabold text-kbc-navy">{title}</p>}
            <p className="text-[15.5px] leading-[1.32] text-kbc-navy">{text}</p>
          </div>
          <div>
            <PillButton onClick={onClick}>{cta}</PillButton>
          </div>
        </div>
        <Artwork icon={icon} image={image} tint={tint} className="w-[38%] shrink-0 [clip-path:ellipse(100%_120%_at_100%_50%)]" />
      </Card>
    </div>
  )
}

export function Tile({
  icon: Icon,
  label,
  badge,
  onClick,
  iconClassName,
  art,
}: {
  icon?: LucideIcon
  label: string
  badge?: string
  onClick?: () => void
  iconClassName?: string
  art?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-[112px] w-[100px] shrink-0 snap-start flex-col items-center justify-center gap-[10px] rounded-[12px] bg-white px-2 pt-2 text-center shadow-[0_2px_10px_rgba(20,41,77,0.08)] transition-transform duration-150 active:scale-[0.97]"
    >
      {badge && (
        <span className="absolute -top-[9px] left-1/2 -translate-x-1/2 rounded-[5px] bg-kbc-green px-2 py-[2px] text-[11.5px] font-semibold text-white">
          {badge}
        </span>
      )}
      {art ?? (Icon && <Icon className={cn('size-[38px] text-kbc-blue', iconClassName)} strokeWidth={1.4} />)}
      <span className="line-clamp-2 text-[13px] leading-[1.25] text-kbc-navy">{label}</span>
    </button>
  )
}

export function HScroll({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-3 pb-4', className)}>
      {children}
      <span aria-hidden className="w-1 shrink-0" />
    </div>
  )
}

export function ListRow({
  icon: Icon,
  label,
  detail,
  onClick,
  trailing,
}: {
  icon?: LucideIcon
  label: string
  detail?: string
  onClick?: () => void
  trailing?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[54px] w-full items-center gap-4 px-4 py-2 text-left transition-colors duration-150 active:bg-kbc-pale"
    >
      {Icon && <Icon className="size-[22px] shrink-0 text-kbc-navy" strokeWidth={1.5} />}
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] text-kbc-navy">{label}</span>
        {detail && <span className="block text-[13px] text-kbc-muted">{detail}</span>}
      </span>
      {trailing ?? <ChevronRight className="size-5 shrink-0 text-kbc-navy" strokeWidth={1.5} />}
    </button>
  )
}

export function MoreDots({ className, label = 'More options' }: { className?: string; label?: string }) {
  return (
    <span role="img" aria-label={label} className={cn('flex gap-[3px]', className)}>
      <span className="size-[5px] rounded-full bg-current" />
      <span className="size-[5px] rounded-full bg-current" />
      <span className="size-[5px] rounded-full bg-current" />
    </span>
  )
}
