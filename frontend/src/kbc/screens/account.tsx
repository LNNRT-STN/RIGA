import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowLeftRight,
  Banknote,
  Copy,
  House,
  Music,
  PiggyBank,
  Search,
  Settings,
  ShoppingBasket,
  TramFront,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { Transaction, TransactionCategory } from '../data'
import { useApp } from '../store'
import { Amount, CircleButton, KateMark } from '../ui'

const categoryIcons: Record<TransactionCategory, LucideIcon | 'R'> = {
  reservation: 'R',
  shopping: ShoppingBasket,
  food: Utensils,
  transport: TramFront,
  subscription: Music,
  transfer: ArrowLeftRight,
  income: Banknote,
  housing: House,
}

export function TransactionRow({ transaction: t }: { transaction: Transaction }) {
  const Icon = categoryIcons[t.category]
  return (
    <div className="flex min-h-[64px] items-center gap-4 px-4 py-2">
      <span className="grid size-[40px] shrink-0 place-items-center rounded-[8px] bg-kbc-pale text-kbc-navy">
        {Icon === 'R' ? (
          <span className="grid h-[19px] w-[24px] place-items-center rounded-[3px] border-[1.5px] border-kbc-navy text-[11px] font-black">
            R
          </span>
        ) : (
          <Icon className="size-[22px]" strokeWidth={1.4} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15.5px] font-bold text-kbc-navy">{t.counterparty}</span>
        {t.note && <span className="block truncate text-[13.5px] text-kbc-muted">{t.note}</span>}
      </span>
      <Amount
        value={t.amount}
        showPlus
        className={t.amount > 0 ? 'text-[15.5px] font-bold text-kbc-green' : 'text-[15.5px] font-bold text-kbc-navy'}
      />
    </div>
  )
}

export function AccountScreen({ accountId }: { accountId: string }) {
  const { accounts, transactions, pop, push, showToast, setQuickPayOpen } = useApp()
  const [query, setQuery] = useState('')
  const account = accounts.find((a) => a.id === accountId) ?? accounts[0]
  const AccountIcon = account.kind === 'savings' ? PiggyBank : Wallet

  const own = transactions.filter((t) => t.accountId === account.id)
  const reserved = own.filter((t) => t.category === 'reservation').reduce((sum, t) => sum + t.amount, 0)
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const map = new Map<string, Transaction[]>()
    for (const t of own) {
      if (q && !`${t.counterparty} ${t.note ?? ''}`.toLowerCase().includes(q)) continue
      map.set(t.group, [...(map.get(t.group) ?? []), t])
    }
    return [...map.entries()]
  }, [own, query])

  const copyIban = async () => {
    try {
      await navigator.clipboard.writeText(account.iban.replace(/\s/g, ''))
    } catch {
      // Clipboard can be unavailable outside secure contexts; the toast still confirms the demo action.
    }
    showToast('Account number copied')
  }

  return (
    <div className="absolute inset-0 z-50 flex animate-in flex-col bg-white duration-300 ease-out slide-in-from-right motion-reduce:animate-none">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[120px]">
        <header className="relative overflow-hidden bg-[#3b8fd3] pt-(--safe-top) text-white">
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(115deg,rgba(18,70,130,0.25)_0%,rgba(18,70,130,0.25)_32%,transparent_32%),linear-gradient(240deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.08)_40%,transparent_40%)]"
          />
          <div className="relative flex h-[62px] items-center gap-3 px-4">
            <CircleButton label="Back" onClick={pop} className="border-white/30 bg-[#8ac6f0] text-white shadow-none">
              <ArrowLeft className="size-[22px]" strokeWidth={1.6} />
            </CircleButton>
            <span className="grid size-[40px] place-items-center rounded-[9px] bg-white text-kbc-blue">
              <AccountIcon className="size-[22px]" strokeWidth={1.5} />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[16px] uppercase">{account.name}</span>
              <span className="block text-[13.5px] text-white/85">{account.iban}</span>
            </span>
            <CircleButton label="Ask Kate" onClick={() => push({ name: 'kate' })} className="border-white/30 bg-[#d8eefc] shadow-none">
              <KateMark className="size-[26px]" plain />
            </CircleButton>
          </div>
          <div className="relative px-[54px] pt-4">
            <Amount value={account.balance} className="text-[32px] leading-none font-extrabold tracking-[-0.01em]" />
            {reserved !== 0 && (
              <p className="mt-2 flex items-center gap-2 text-[13.5px] text-white/90">
                <span className="grid h-[14px] w-[18px] place-items-center rounded-[2px] border border-white/90 text-[8px] font-black">R</span>
                <Amount value={account.balance + reserved} />
                <span className="sr-only">available after reservations</span>
              </p>
            )}
          </div>
          <div className="relative grid grid-cols-2 px-6 pt-6 pb-5">
            <HeaderAction icon={Copy} label="Copy account number" onClick={copyIban} />
            <HeaderAction icon={Settings} label="Settings and more" onClick={() => push({ name: 'settings' })} />
          </div>
        </header>

        <div className="px-4 pt-4">
          <label className="flex h-[46px] items-center rounded-[8px] border-[1.5px] border-[#8195b1] px-4 focus-within:border-kbc-blue">
            <span className="sr-only">Search for a payment</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a payment"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-kbc-navy outline-none placeholder:text-[#7586a0]"
            />
            <Search className="size-[22px] text-kbc-blue" strokeWidth={1.6} />
          </label>
        </div>

        {groups.length === 0 ? (
          <p className="px-4 pt-8 text-center text-[15px] text-kbc-muted">No payments match “{query}”.</p>
        ) : (
          groups.map(([group, items]) => (
            <section key={group} className="pt-5">
              <h2 className="px-4 pb-1 text-[15.5px] text-kbc-muted">{group}</h2>
              {items.map((t) => (
                <TransactionRow key={t.id} transaction={t} />
              ))}
            </section>
          ))
        )}
      </div>

      <TransferFab onClick={() => setQuickPayOpen(true)} />
    </div>
  )
}

function HeaderAction({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2 text-center">
      <span className="grid size-[40px] place-items-center rounded-full bg-white/25">
        <Icon className="size-[18px]" strokeWidth={1.5} />
      </span>
      <span className="max-w-[120px] text-[13.5px] leading-[1.25]">{label}</span>
    </button>
  )
}

export function TransferFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Pay or transfer"
      onClick={onClick}
      className="absolute right-[18px] bottom-[calc(max(14px,var(--safe-bottom)-10px)+80px)] z-40 grid size-[56px] place-items-center rounded-full bg-kbc-blue text-white shadow-[0_6px_16px_rgba(36,110,180,0.35)] transition-transform duration-150 active:scale-95"
    >
      <ArrowLeftRight className="size-[26px]" strokeWidth={1.6} />
    </button>
  )
}

