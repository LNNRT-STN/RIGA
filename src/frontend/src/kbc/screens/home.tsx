import { useState } from 'react'
import {
  Bike,
  ChevronDown,
  Coins,
  FileText,
  Heart,
  House,
  HouseIcon,
  KeyRound,
  Leaf,
  Lightbulb,
  Mountain,
  Newspaper,
  Pencil,
  PiggyBank,
  Plus,
  Recycle,
  Search,
  ShieldCheck,
  Signpost,
  Smartphone,
  Sprout,
  Star,
  Ticket,
  TrainFront,
  Users,
  Wallet,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { forYou, inAndOut, kateCoins, newsHeadlines, type ForYouItem } from '../data'
import { TabPage } from '../layout'
import { useApp } from '../store'
import { Amount, Artwork, Card, KateMark, MoreDots, PillButton, SectionHeader } from '../ui'
import { TransactionRow } from './account'

export function HomeScreen() {
  return (
    <TabPage className="bg-kbc-pale">
      <div className="bg-white pb-2">
        <TopicChips />
        <AccountCarousel />
      </div>
      <div className="bg-[linear-gradient(180deg,#ffffff_0px,#f3fafe_120px)]">
        <ForYouSection />
      </div>
      <KateWalletSection />
      <MoneyOverview />
      <DreamCard />
      <SectionHeader title="Kate Coins" action="See more" />
      <p className="px-4 text-[16px] text-kbc-muted">Get great discounts at KBC and many partners</p>
      <ExtraServices />
      <SectionHeader title="Split group expenses" />
      <div className="px-4">
        <Card className="flex min-h-[150px] overflow-hidden">
          <div className="flex flex-1 flex-col justify-between gap-3 py-[18px] pr-2 pl-4">
            <div>
              <p className="text-[17px] font-extrabold text-kbc-navy">Split group expenses</p>
              <p className="mt-1 text-[15px] leading-[1.32] text-kbc-navy">
                Weekend away with friends? Keep track of your shared expenses.
              </p>
            </div>
            <div>
              <PillButton>See how it works</PillButton>
            </div>
          </div>
          <Artwork icon={Users} tint="sand" className="w-[34%] shrink-0" />
        </Card>
      </div>
      <FinancialNews />
      <SectionHeader title="My Trustbox" />
      <div className="px-4">
        <Card className="flex min-h-[104px] overflow-hidden">
          <div className="flex-1 py-4 pr-2 pl-4">
            <p className="text-[19px] leading-none font-extrabold text-kbc-navy">
              <span className="text-kbc-blue">my</span>trustbox
            </p>
            <p className="mt-2 text-[14.5px] leading-[1.35] text-kbc-navy">Your documents and data safely in one place.</p>
          </div>
          <Artwork icon={ShieldCheck} tint="navy" className="w-[40%] shrink-0" />
        </Card>
      </div>
      <SectionHeader title="Together more sustainable" />
      <div className="px-4">
        <Card className="flex min-h-[126px] overflow-hidden bg-[#effaf0]">
          <div className="flex flex-1 flex-col justify-between gap-3 py-4 pr-2 pl-4">
            <p className="text-[15.5px] leading-[1.32] text-kbc-navy">
              How big is your CO₂ footprint? And how can we help you reduce it?
            </p>
            <div>
              <PillButton variant="outline" tone="green">
                Tell me more
              </PillButton>
            </div>
          </div>
          <div aria-hidden className="relative w-[34%] shrink-0">
            <span className="absolute top-3 left-3 grid size-9 rotate-12 place-items-center rounded-[8px] bg-white text-kbc-lime shadow-sm">
              <Recycle className="size-5" strokeWidth={1.5} />
            </span>
            <span className="absolute top-9 left-[46px] grid size-11 -rotate-12 place-items-center rounded-[10px] bg-kbc-lime text-white shadow-sm">
              <Leaf className="size-6" strokeWidth={1.5} />
            </span>
            <span className="absolute right-2 bottom-3 grid size-9 rotate-[20deg] place-items-center rounded-[8px] bg-white text-kbc-lime shadow-sm">
              <Sprout className="size-5" strokeWidth={1.5} />
            </span>
          </div>
        </Card>
      </div>
      <div className="mt-9 bg-white py-3">
        <FooterRow icon={HouseIcon} label="Personalise home page" />
        <FooterRow icon={Heart} label="Handy in KBC Mobile" />
      </div>
    </TabPage>
  )
}

function TopicChips() {
  const chips: { label: string; icon: LucideIcon }[] = [
    { label: 'MyNWS', icon: Newspaper },
    { label: 'MyHome', icon: House },
    { label: 'MyMobility', icon: Signpost },
  ]
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-2 pb-1">
      <button
        type="button"
        aria-label="Accounts"
        aria-pressed
        className="grid h-[33px] w-[36px] shrink-0 place-items-center rounded-full bg-kbc-navy text-white"
      >
        <Wallet className="size-[17px]" strokeWidth={1.6} />
      </button>
      {chips.map(({ label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          className="flex h-[33px] shrink-0 items-center gap-[6px] rounded-full bg-kbc-pale px-3 text-[15px] text-kbc-navy"
        >
          <Icon className="size-[16px]" strokeWidth={1.5} />
          {label}
        </button>
      ))}
    </div>
  )
}

function AccountCarousel() {
  const { accounts, push, setTab, transactions } = useApp()
  const [showPayments, setShowPayments] = useState(false)
  const recent = transactions.filter((t) => t.accountId === 'current').slice(0, 4)

  return (
    <>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-[10px] overflow-x-auto pt-4 pr-4 pb-3">
        <button
          type="button"
          onClick={() => setTab('mykbc')}
          aria-label={`Kate Coins: ${kateCoins.toFixed(2)} KTC`}
          className="flex h-[168px] w-[30px] shrink-0 flex-col items-center justify-between rounded-r-[10px] bg-white pb-3 shadow-[0_2px_10px_rgba(20,41,77,0.1)]"
        >
          <span className="flex h-[95px] w-full items-center justify-center rounded-tr-[10px] bg-[linear-gradient(180deg,#2f6aa3,#1d4f86)]">
            <span className="-rotate-90 text-[12px] font-bold whitespace-nowrap text-white">
              <Amount value={kateCoins} currency="KTC" />
            </span>
          </span>
          <span className="grid size-[19px] place-items-center rounded-full bg-kbc-blue text-[10px] font-black text-white ring-2 ring-[#bfe0f6]">
            K
          </span>
        </button>
        {accounts.map((account, i) => {
          const Icon = account.kind === 'savings' ? PiggyBank : Wallet
          return (
            <div key={account.id} className="relative shrink-0 snap-start">
              <button
                type="button"
                onClick={() => push({ name: 'account', accountId: account.id })}
                className="flex h-[168px] w-[126px] flex-col overflow-hidden rounded-[10px] bg-white text-left shadow-[0_2px_10px_rgba(20,41,77,0.1)] transition-transform duration-150 active:scale-[0.98]"
              >
                <span className="relative grid h-[96px] w-full place-items-center overflow-hidden bg-kbc-sky">
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(120deg,transparent_45%,rgba(255,255,255,0.14)_45%,rgba(255,255,255,0.14)_70%,transparent_70%),linear-gradient(60deg,rgba(0,40,90,0.08)_30%,transparent_30%)]"
                  />
                  <Icon className="relative size-[40px] text-white" strokeWidth={1.4} />
                  {i === 0 && (
                    <span className="absolute bottom-[-1px] left-[8px] grid h-[18px] w-[24px] place-items-center rounded-t-[6px] bg-white text-[9px] font-black text-kbc-navy">
                      R
                    </span>
                  )}
                </span>
                <span className="flex flex-1 flex-col gap-1 px-[9px] pt-[9px]">
                  <span className="truncate text-[12.5px] text-kbc-navy uppercase">{account.name}</span>
                  <Amount value={account.balance} className="text-[16px] font-bold text-kbc-navy" />
                </span>
                {i === 0 && <span className="mx-[9px] mb-[9px] h-[4px] rounded-full bg-kbc-blue" />}
              </button>
              {i === 0 && (
                <span
                  aria-hidden
                  className="absolute -top-[4px] -right-[4px] grid size-[24px] place-items-center rounded-full bg-white text-kbc-blue shadow"
                >
                  <Pencil className="size-[12px]" strokeWidth={1.8} />
                </span>
              )}
            </div>
          )
        })}
        <div className="flex shrink-0 snap-start flex-col gap-3">
          <button
            type="button"
            className="flex h-[56px] w-[176px] items-center gap-3 rounded-[10px] bg-white px-4 text-[14.5px] text-kbc-navy shadow-[0_2px_10px_rgba(20,41,77,0.1)]"
          >
            <Star className="size-5 text-kbc-navy" strokeWidth={1.5} />
            Edit favourites
          </button>
          <button
            type="button"
            onClick={() => setTab('offers')}
            className="flex h-[56px] w-[176px] items-center gap-3 rounded-[10px] bg-white px-4 text-[14.5px] text-kbc-navy shadow-[0_2px_10px_rgba(20,41,77,0.1)]"
          >
            <span className="grid size-5 place-items-center rounded-full border-[1.5px] border-kbc-lime text-kbc-lime">
              <Plus className="size-3.5" strokeWidth={2.2} />
            </span>
            New product
          </button>
        </div>
      </div>
      <button
        type="button"
        aria-expanded={showPayments}
        onClick={() => setShowPayments((v) => !v)}
        className="flex h-[44px] items-center gap-4 pl-9 text-[14.5px] font-bold text-kbc-link"
      >
        <ChevronDown
          className={cn('size-5 transition-transform duration-200', showPayments && 'rotate-180')}
          strokeWidth={1.8}
        />
        {showPayments ? 'Hide payments' : 'Show payments'}
      </button>
      {showPayments && (
        <div className="animate-in pb-2 duration-200 fade-in slide-in-from-top-2">
          {recent.map((t) => (
            <TransactionRow key={t.id} transaction={t} />
          ))}
          <button
            type="button"
            onClick={() => push({ name: 'account', accountId: 'current' })}
            className="ml-4 h-[40px] text-[14.5px] font-bold text-kbc-link"
          >
            All payments
          </button>
        </div>
      )}
    </>
  )
}

const forYouIcons: Record<ForYouItem['icon'], LucideIcon | null> = {
  kate: null,
  'house-search': Search,
  'house-key': KeyRound,
  lightbulb: Lightbulb,
  shield: ShieldCheck,
}

export function ForYouCard({ item, unread = false }: { item: ForYouItem; unread?: boolean }) {
  const { dismiss, push } = useApp()
  const Icon = forYouIcons[item.icon]
  return (
    <div className="relative px-4">
      {unread && <span aria-label="Unread" className="absolute top-[-2px] left-[12px] size-[9px] rounded-full bg-kbc-red" />}
      <Card className="flex gap-4 py-4 pr-11 pl-4">
        <button
          type="button"
          onClick={() => push({ name: 'kate', prompt: item.body })}
          className="contents text-left"
        >
          <span className="shrink-0 pt-1">
            {Icon ? (
              <span className="relative grid size-[46px] place-items-center text-kbc-navy">
                <House className="size-[34px]" strokeWidth={1.2} />
                <Icon className="absolute right-[4px] bottom-[6px] size-[15px] bg-white" strokeWidth={1.8} />
              </span>
            ) : (
              <KateMark className="size-[46px]" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            {item.title && (
              <span className="mb-1 flex items-center gap-[6px] text-[14.5px] font-bold text-kbc-navy">
                <KateMark className="size-[16px]" />
                {item.title}
              </span>
            )}
            <span className="block text-[16px] leading-[1.45] text-kbc-navy">{item.body}</span>
            {item.footnote && <span className="mt-2 block text-[12px] leading-[1.35] text-kbc-navy">{item.footnote}</span>}
          </span>
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => dismiss(item.id)}
          className="absolute top-[10px] right-[24px] grid size-[28px] place-items-center rounded-full bg-[#f2f5f8] text-kbc-navy"
        >
          <X className="size-[13px]" strokeWidth={2} />
        </button>
      </Card>
    </div>
  )
}

function ForYouSection() {
  const { dismissed, push } = useApp()
  const items = forYou.filter((item) => !dismissed.has(item.id))
  return (
    <>
      <SectionHeader title="For you" action="All communication" onAction={() => push({ name: 'messages' })} className="pt-6" />
      <div className="flex flex-col gap-4">
        {items.length === 0 ? (
          <p className="px-4 text-[15px] text-kbc-muted">You’re all caught up. New tips from Kate will appear here.</p>
        ) : (
          items.map((item, i) => <ForYouCard key={item.id} item={item} unread={i === 0 && item.kind === 'kate'} />)
        )}
      </div>
    </>
  )
}

function KateWalletSection() {
  return (
    <>
      <SectionHeader title="Kate Wallet" action="Open Kate Wallet" />
      <div className="px-4">
        <div className="relative flex h-[108px] items-center overflow-hidden rounded-[12px] bg-[linear-gradient(100deg,#2b5f91_0%,#3b84bf_55%,#69b3dc_100%)] pl-4 text-white shadow-[0_2px_10px_rgba(20,41,77,0.1)]">
          <div className="relative z-10">
            <p className="text-[21px] leading-tight font-extrabold">Kate Wallet</p>
            <p className="text-[14.5px]">3 items in your Kate Wallet</p>
            <PillButton variant="outline" tone="white" className="mt-2 h-[26px] text-[15px]">
              Open Kate Wallet
            </PillButton>
          </div>
          <div aria-hidden className="absolute -right-2 bottom-[-18px] h-[104px] w-[118px] rotate-[-18deg] rounded-[14px] border-[2px] border-kbc-navy bg-white">
            <div className="m-[10px] grid grid-cols-2 gap-[6px]">
              {Array.from({ length: 4 }, (_, i) => (
                <span key={i} className="h-[22px] rounded-[5px] border-[1.5px] border-kbc-navy" />
              ))}
            </div>
          </div>
          <div aria-hidden className="absolute top-[18px] right-[56px] grid h-[30px] w-[50px] rotate-[-18deg] place-items-center rounded-[5px] bg-kbc-blue ring-[1.5px] ring-kbc-navy">
            <Smartphone className="size-4 text-white" strokeWidth={1.6} />
          </div>
          <MoreDots className="absolute top-4 right-4 text-white" />
        </div>
      </div>
    </>
  )
}

function MoneyOverview() {
  const max = Math.max(...inAndOut.history.flatMap((m) => [m.income, m.expenses]))
  const last = inAndOut.history.length - 1
  return (
    <>
      <SectionHeader title="Your money at a glance" action="Show all" />
      <div className="px-4">
        <Card className="px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <p className="text-[17px] text-kbc-navy">
              In &amp; out <span className="ml-1 text-[14.5px] text-kbc-muted">{inAndOut.month}</span>
            </p>
            <MoreDots className="text-kbc-navy" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Figure label="Income" value={inAndOut.income} color="bg-kbc-green" sign="+" />
            <Figure label="Expenses" value={inAndOut.expenses} color="bg-kbc-yellow" sign="−" />
          </div>
          <div
            role="img"
            aria-label={`Income and expenses from ${inAndOut.history[0].month} to ${inAndOut.history[last].month}`}
            className="mt-5 flex h-[118px] items-end justify-between border-b border-kbc-line px-2"
          >
            {inAndOut.history.map((m, i) => (
              <div key={m.month} className="flex items-end gap-[6px]">
                <span
                  className={cn('w-[8px] rounded-t-full', i === last ? 'bg-kbc-green' : 'bg-[#cfe3dd]')}
                  style={{ height: Math.max(6, (m.income / max) * 108) }}
                />
                <span
                  className={cn('w-[8px] rounded-t-full', i === last ? 'bg-kbc-yellow' : 'bg-[#f7ecc0]')}
                  style={{ height: Math.max(6, (m.expenses / max) * 108) }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between px-1">
            {inAndOut.history.map((m, i) => (
              <span key={m.month} className={cn('w-[34px] text-center text-[13.5px]', i === last ? 'font-bold text-kbc-navy' : 'text-kbc-muted')}>
                {m.month}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

function Figure({ label, value, color, sign }: { label: string; value: number; color: string; sign: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn('relative grid size-[40px] place-items-center rounded-[8px] text-white', color)}>
        <Coins className="size-[22px]" strokeWidth={1.4} />
        <span className="absolute top-[1px] right-[5px] text-[11px] leading-none font-bold">{sign}</span>
      </span>
      <span>
        <span className="block text-[14.5px] text-kbc-muted">{label}</span>
        <Amount value={value} className="text-[15.5px] text-kbc-navy" />
      </span>
    </div>
  )
}

function DreamCard() {
  const { push } = useApp()
  return (
    <div className="mt-6 px-4">
      <Card className="relative flex min-h-[122px] overflow-hidden">
        <div className="flex flex-1 flex-col justify-between gap-3 py-4 pr-2 pl-4">
          <p className="text-[15.5px] leading-[1.3] text-kbc-navy">Kate suggests: a fun new way to save for your dreams.</p>
          <div>
            <PillButton variant="outline" onClick={() => push({ name: 'kate', prompt: 'Help me save for a dream' })}>
              What do you dream of?
            </PillButton>
          </div>
        </div>
        <div className="relative grid w-[36%] shrink-0 place-items-center bg-[#f3f9fd] [clip-path:ellipse(100%_120%_at_100%_50%)]">
          <span className="relative grid size-[70px] place-items-center rounded-full">
            <span aria-hidden className="absolute inset-[-5px] rounded-full border-[2.5px] border-kbc-blue border-t-transparent border-r-transparent rotate-45" />
            <Artwork icon={Mountain} className="size-[64px] rounded-full [&_svg]:size-[28px]" />
          </span>
        </div>
        <MoreDots className="absolute top-3 right-3 text-kbc-navy" />
      </Card>
    </div>
  )
}

function ExtraServices() {
  const [favourites, setFavourites] = useState<ReadonlySet<string>>(new Set(['Public transport']))
  const services: { name: string; detail: string; icon: LucideIcon }[] = [
    { name: 'Financial news', detail: 'Read news articles for free', icon: Newspaper },
    { name: 'Roadside assistance', detail: 'Get help after a breakdown', icon: Wrench },
    { name: 'Public transport', detail: 'Buy tickets or 10-ride passes', icon: Ticket },
    { name: 'Train tickets', detail: 'Buy your train ticket', icon: TrainFront },
    { name: 'Shared bikes', detail: 'Unlock a bike nearby', icon: Bike },
    { name: 'Parking', detail: 'Pay for street parking', icon: FileText },
  ]
  const toggle = (name: string) =>
    setFavourites((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  return (
    <>
      <SectionHeader title="Extra services" action="See more" />
      <div className="px-4">
        <Card className="pt-4 pb-5">
          <div className="flex items-center justify-between px-4">
            <p className="text-[16px] text-kbc-navy">Your favourites</p>
            <MoreDots className="text-kbc-navy" />
          </div>
          <div className="flex min-h-[64px] items-center gap-3 px-4 py-3">
            {services
              .filter((s) => favourites.has(s.name))
              .map(({ name, icon: Icon }) => (
                <span key={name} aria-label={name} className="grid size-[44px] place-items-center rounded-[10px] bg-[#ffe75a] text-kbc-navy">
                  <Icon className="size-6" strokeWidth={1.5} />
                </span>
              ))}
          </div>
          <p className="px-4 pt-2 pb-3 text-[16px] text-kbc-navy">Our other extra services</p>
          <div className="no-scrollbar grid snap-x grid-flow-col grid-rows-3 gap-x-4 gap-y-3 overflow-x-auto px-4">
            {services.map(({ name, detail, icon: Icon }) => (
              <div key={name} className="flex w-[270px] snap-start items-center gap-3">
                <span className="grid size-[48px] shrink-0 place-items-center rounded-[10px] bg-white text-kbc-blue shadow-[0_2px_8px_rgba(20,41,77,0.1)]">
                  <Icon className="size-[24px]" strokeWidth={1.4} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] text-kbc-navy">{name}</span>
                  <span className="block truncate text-[12.5px] text-kbc-muted">{detail}</span>
                </span>
                <button
                  type="button"
                  aria-label={favourites.has(name) ? `Remove ${name} from favourites` : `Add ${name} to favourites`}
                  aria-pressed={favourites.has(name)}
                  onClick={() => toggle(name)}
                  className="grid size-[40px] place-items-center text-kbc-blue"
                >
                  <Heart className="size-[22px]" strokeWidth={1.5} fill={favourites.has(name) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

function FinancialNews() {
  return (
    <>
      <SectionHeader title="Financial news" />
      <div className="px-4">
        <Card className="relative px-4 pt-9 pb-4">
          <MoreDots className="absolute top-4 right-4 text-kbc-navy" />
          <ul className="flex flex-col gap-5">
            {newsHeadlines.map((headline) => (
              <li key={headline} className="flex gap-4">
                <span className="flex w-[34px] shrink-0 flex-col items-center text-[11px] leading-none font-black">
                  <span className="text-kbc-navy">NWS</span>
                  <span className="mt-[3px] rounded-[3px] bg-[#5b3df5] px-[3px] py-[2px] text-[9px] text-white">news</span>
                </span>
                <span className="text-[15.5px] leading-[1.3] text-kbc-navy">{headline}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-center text-[14.5px] text-kbc-muted">2 new articles</p>
        </Card>
      </div>
    </>
  )
}

function FooterRow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button type="button" className="flex h-[52px] w-full items-center gap-4 px-4 text-left text-[17.5px] text-kbc-navy">
      <Icon className="size-[24px]" strokeWidth={1.4} />
      <span className="flex-1">{label}</span>
      <ChevronDown className="size-5 -rotate-90" strokeWidth={1.5} />
    </button>
  )
}
