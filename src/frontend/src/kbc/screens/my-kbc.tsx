import type { ReactNode } from 'react'
import { Bell, CarFront, ChartPie, HeartHandshake, PiggyBank, Plus, Wallet } from 'lucide-react'
import { customer, investments, kateCoins } from '../data'
import { TabPage } from '../layout'
import { useApp } from '../store'
import { Amount, Card, PromoCard } from '../ui'

export function MyKbcScreen() {
  const { accounts, push, setTab } = useApp()
  return (
    <TabPage title="My KBC" katePrompt="Make a transfer?">
      <Section title="Accounts" onNew={() => setTab('offers')}>
        {accounts.map((a) => {
          const Icon = a.kind === 'savings' ? PiggyBank : Wallet
          return (
            <button key={a.id} type="button" onClick={() => push({ name: 'account', accountId: a.id })} className="w-full text-left">
              <Card className="flex min-h-[72px] items-center gap-3 px-3 py-3 transition-transform duration-150 active:scale-[0.99]">
                <span className="grid size-[44px] shrink-0 place-items-center rounded-[8px] bg-kbc-sky text-white">
                  <Icon className="size-[22px]" strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15.5px] text-kbc-navy uppercase">{a.name}</span>
                  <span className="block text-[14px] text-kbc-navy">{a.iban}</span>
                </span>
                <Amount value={a.balance} className="text-[16px] text-kbc-navy" />
              </Card>
            </button>
          )
        })}
      </Section>

      <Section title="Payment methods" onNew={() => setTab('offers')}>
        <Card className="flex items-center gap-3 px-3 py-3">
          <span className="grid size-[44px] shrink-0 place-items-center rounded-[8px] bg-[#1d4fa0]">
            <span className="h-[14px] w-[26px] rounded-[2px] bg-[linear-gradient(90deg,#1d4fa0_0_45%,#f6c445_45%)] ring-2 ring-white" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15.5px] text-kbc-navy">KBC debit card</span>
            <span className="block text-[14px] text-kbc-navy uppercase">{customer.holder}</span>
            <span className="block text-[13px] text-kbc-muted">**** 4417</span>
          </span>
        </Card>
      </Section>

      <Section title="Kate Coins">
        <Card className="flex min-h-[72px] items-center gap-3 px-3 py-3">
          <span className="grid size-[36px] place-items-center rounded-full bg-kbc-blue text-[17px] font-black text-white ring-[3px] ring-[#bfe0f6]">
            K
          </span>
          <span className="flex-1 text-[16px] text-kbc-navy">Kate Coins</span>
          <Amount value={kateCoins} currency="KTC" className="text-[16px] text-kbc-navy" />
        </Card>
      </Section>

      <Section title="Investments" onNew={() => setTab('invest')}>
        {investments.map((inv, i) => (
          <button key={inv.id} type="button" onClick={() => setTab('invest')} className="w-full text-left">
            <Card className="flex min-h-[72px] items-center gap-3 px-3 py-3">
              {i === 0 ? (
                <ChartPie className="size-[40px] shrink-0 text-kbc-navy" strokeWidth={1.3} />
              ) : (
                <span className="grid size-[44px] shrink-0 place-items-center rounded-[8px] bg-[#9b4fb0] text-[24px] font-black text-white">B</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15.5px] text-kbc-navy uppercase">{inv.name}</span>
                <Amount value={inv.value} className="text-[16px] text-kbc-navy" />
              </span>
            </Card>
          </button>
        ))}
      </Section>

      <Section title="Loans" onNew={() => setTab('offers')}>
        <div className="-mx-4">
          <PromoCard text="Simulate and take out a loan or lease." cta="See our offer" icon={CarFront} />
        </div>
      </Section>

      <Section title="Insurance" onNew={() => setTab('offers')}>
        <div className="-mx-4">
          <PromoCard text="Calculate and take out an insurance policy." cta="See our offer" icon={HeartHandshake} tint="sand" />
        </div>
      </Section>

      <Section title="Messages">
        <div className="-mx-4">
          <PromoCard
            text="Tap the bell at the top right to find your messages from now on."
            cta="Take a look"
            icon={Bell}
            onClick={() => push({ name: 'messages' })}
          />
        </div>
      </Section>

    </TabPage>
  )
}

function Section({ title, onNew, children }: { title: string; onNew?: () => void; children: ReactNode }) {
  return (
    <section className="px-4 pt-8">
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-[19px] font-extrabold text-kbc-navy">{title}</h2>
        {onNew && (
          <button type="button" onClick={onNew} className="flex items-center gap-2 text-[16px] text-[#4c648b]">
            <span className="grid size-[22px] place-items-center rounded-full bg-kbc-lime text-white">
              <Plus className="size-[15px]" strokeWidth={2.4} />
            </span>
            New
          </button>
        )}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}
