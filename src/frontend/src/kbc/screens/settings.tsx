import { useState } from 'react'
import {
  Accessibility,
  ArrowLeftRight,
  Bell,
  CalendarSync,
  CircleUserRound,
  Contact,
  EyeOff,
  FileText,
  Fingerprint,
  Gauge,
  House,
  KeyRound,
  LayoutGrid,
  LockKeyhole,
  LogOut,
  Moon,
  ScanFace,
  ShieldCheck,
  Smartphone,
  Watch,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { customer, messages } from '../data'
import { PushedPage } from '../layout'
import { useApp } from '../store'
import { CircleButton, KateMark, ListRow } from '../ui'
import { ForYouCard } from './home'

export function SettingsScreen() {
  const { hideAmounts, setHideAmounts, logOut, showToast, push } = useApp()
  const soon = () => showToast('This setting is not part of the demo')

  const sections: { title: string; rows: [string, LucideIcon][] }[] = [
    {
      title: 'App settings',
      rows: [
        ['Personalise login screen', Smartphone],
        ['Personalise home page', House],
        ['Dark mode', Moon],
        ['Push notifications', Bell],
        ['Widgets', LayoutGrid],
        ['Smartwatch', Watch],
        ['Accessibility', Accessibility],
      ],
    },
    {
      title: 'Payments',
      rows: [
        ['Beneficiaries', Contact],
        ['Transfer speed', Gauge],
        ['Direct debits', CalendarSync],
        ['Standing orders', ArrowLeftRight],
        ['Limits', Gauge],
        ['Account statements', FileText],
      ],
    },
    {
      title: 'Security',
      rows: [
        ['KBC Trust', ShieldCheck],
        ['What you share with KBC Trust', LockKeyhole],
        ['Secret code', KeyRound],
        ['Face ID', ScanFace],
        ['Activate on another device', Fingerprint],
      ],
    },
  ]

  const opens: Record<string, 'trust' | 'trust-data'> = { 'KBC Trust': 'trust', 'What you share with KBC Trust': 'trust-data' }

  return (
    <PushedPage title="Settings and more" className="pb-12">
      <ListRow icon={CircleUserRound} label="Your details and family" detail={customer.holder} onClick={soon} />
      <ListRow
        icon={EyeOff}
        label="Hide amounts"
        detail={hideAmounts ? 'On' : 'Off'}
        onClick={() => setHideAmounts(!hideAmounts)}
        trailing={<Switch on={hideAmounts} />}
      />
      {sections.map((s) => (
        <section key={s.title}>
          <h2 className="px-4 pt-7 pb-2 text-[19px] font-extrabold text-kbc-navy">{s.title}</h2>
          {s.rows.map(([label, icon]) => (
            <ListRow key={label} icon={icon} label={label} onClick={opens[label] ? () => push({ name: opens[label] }) : soon} />
          ))}
        </section>
      ))}
      <section>
        <h2 className="px-4 pt-7 pb-2 text-[19px] font-extrabold text-kbc-navy">More</h2>
        <ListRow icon={CircleUserRound} label={`Client number: ${customer.clientNumber}`} trailing={<span />} />
        <ListRow icon={FileText} label="Version: prototype 0.1 (demo)" trailing={<span />} />
        <ListRow icon={LogOut} label="Log off" onClick={logOut} />
      </section>
    </PushedPage>
  )
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn('relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200', on ? 'bg-kbc-blue' : 'bg-[#d5dbe2]')}
    >
      <span
        className={cn(
          'absolute top-[2px] left-[2px] size-[27px] rounded-full bg-white shadow transition-transform duration-200',
          on && 'translate-x-[20px]',
        )}
      />
    </span>
  )
}

const messageTabs = ['For you', 'Messages', 'Your contacts'] as const

export function MessagesScreen() {
  const { dismissed, push } = useApp()
  const [tab, setTab] = useState<(typeof messageTabs)[number]>('For you')
  const items = messages.filter((m) => !dismissed.has(m.id))

  return (
    <PushedPage
      title="Your communication"
      className="bg-kbc-pale pb-12"
      trailing={
        <CircleButton label="Ask Kate" onClick={() => push({ name: 'kate' })}>
          <KateMark className="size-[24px]" plain />
        </CircleButton>
      }
    >
      <div role="tablist" className="sticky top-0 z-10 flex gap-5 border-b border-kbc-line bg-white px-4">
        {messageTabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'h-[42px] border-b-2 text-[16px] transition-colors duration-150',
              tab === t ? 'border-kbc-navy font-semibold text-kbc-navy' : 'border-transparent text-kbc-link',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'For you' ? (
        <div className="flex flex-col gap-4 pt-5">
          {items.map((item) => (
            <ForYouCard key={item.id} item={item} unread />
          ))}
        </div>
      ) : (
        <p className="px-6 pt-16 text-center text-[15.5px] leading-[1.45] text-kbc-muted">
          {tab === 'Messages'
            ? 'You have no messages. When KBC sends you a message, you’ll find it here.'
            : 'Your KBC contacts will appear here once you have an appointment.'}
        </p>
      )}
    </PushedPage>
  )
}
