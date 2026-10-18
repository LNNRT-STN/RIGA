import {
  CalendarClock,
  ChartColumnIncreasing,
  CircleUserRound,
  Eye,
  FileText,
  Gem,
  House,
  Lightbulb,
  ListOrdered,
  Newspaper,
  Rows3,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { investments } from '../data'
import { TabPage } from '../layout'
import { useApp } from '../store'
import { Amount, Artwork, Card, ListRow, PillButton, SectionHeader } from '../ui'

export function InvestScreen() {
  const { push } = useApp()
  const total = investments.reduce((sum, i) => sum + i.value, 0)

  return (
    <TabPage title="Invest" katePrompt="Invest your spare change?">
      <div className="px-4 pt-4">
        <Card className="border border-[#c8def2] px-4 pt-4 pb-4 shadow-none">
          <p className="text-[14.5px] text-kbc-muted">Total portfolio</p>
          <Amount value={total} className="text-[28px] font-extrabold text-kbc-navy" />
          <ul className="mt-4 divide-y divide-kbc-line">
            {investments.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 py-3">
                <span className="grid size-[40px] place-items-center rounded-[8px] bg-kbc-pale text-kbc-blue">
                  <TrendingUp className="size-5" strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-kbc-navy">{inv.name}</span>
                  <span className={cn('text-[13px] font-semibold', inv.change >= 0 ? 'text-kbc-green' : 'text-[#b42318]')}>
                    {inv.change >= 0 ? '▲' : '▼'} {Math.abs(inv.change).toFixed(1)}% this year
                  </span>
                </span>
                <Amount value={inv.value} className="text-[15.5px] font-bold text-kbc-navy" />
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-2 flex h-[40px] items-center gap-2 rounded-[6px] border border-[#c8def2] px-3 text-[14.5px] text-kbc-navy"
          >
            <Rows3 className="size-[18px]" strokeWidth={1.5} />
            Other view
          </button>
        </Card>
      </div>

      <SectionHeader title="Investment plans" />
      <div className="px-4">
        <Card className="flex min-h-[124px] items-center gap-3 py-4 pr-3 pl-4">
          <div className="flex-1">
            <p className="text-[15.5px] leading-[1.32] text-kbc-navy">
              You don’t have an investment plan yet. Would you like to put aside an amount every month?
            </p>
            <PillButton variant="outline" className="mt-3" onClick={() => push({ name: 'kate', prompt: 'Help me start an investment plan' })}>
              Find out more
            </PillButton>
          </div>
          <ChartColumnIncreasing aria-hidden className="size-[64px] shrink-0 text-kbc-blue" strokeWidth={1.1} />
        </Card>
      </div>

      <SectionHeader title="Investment strategy" />
      <div className="px-4">
        <Card className="flex min-h-[116px] overflow-hidden">
          <div className="flex-1 py-4 pr-2 pl-4">
            <p className="text-[14.5px] font-bold text-kbc-navy">Investment strategy</p>
            <p className="mt-1 text-[15px] leading-[1.32] text-kbc-navy">
              Discover our experts’ weekly view on the financial markets.
            </p>
          </div>
          <Artwork icon={Lightbulb} tint="navy" className="w-[32%] shrink-0" />
        </Card>
      </div>

      <SectionHeader title="Your property" />
      <div className="px-4">
        <Card className="flex items-center gap-3 px-4 py-4">
          <House className="size-[34px] shrink-0 text-kbc-blue" strokeWidth={1.3} />
          <p className="text-[14.5px] leading-[1.35] text-kbc-navy">Want to know what your property is worth? Get an estimate here.</p>
        </Card>
      </div>

      <SectionHeader title="Valuables" />
      <div className="px-4">
        <Card className="flex items-center gap-3 px-4 py-4">
          <Gem className="size-[30px] shrink-0 text-kbc-blue" strokeWidth={1.3} />
          <p className="text-[14.5px] leading-[1.35] text-kbc-navy">Keep track of your valuables and their documents in one safe place.</p>
        </Card>
      </div>

      <div className="mt-8 bg-kbc-pale pt-6 pb-4">
        <p className="px-4 pb-2 text-[16px] text-kbc-navy">What are you looking for?</p>
        {(
          [
            ['Investment proposals', Lightbulb],
            ['Orders', ListOrdered],
            ['Products with a maturity date', CalendarClock],
            ['Show total assets', Wallet],
            ['Investor profile', CircleUserRound],
            ['Check your investment knowledge', Eye],
            ['Trade on the stock market with Bolero', Newspaper],
            ['Opt out of capital gains tax', FileText],
          ] as [string, LucideIcon][]
        ).map(([label, icon]) => (
          <ListRow key={label} icon={icon} label={label} />
        ))}
      </div>
    </TabPage>
  )
}
