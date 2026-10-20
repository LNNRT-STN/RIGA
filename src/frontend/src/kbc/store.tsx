import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { initialAccounts, initialTransactions, type Account, type Transaction } from './data'
import { defaultTrustControls, initialActivity, timeNow, type ActivityEntry, type TrustControls } from './trust/controls'

export type Tab = 'home' | 'mykbc' | 'invest' | 'offers'

export type Route =
  | { name: 'account'; accountId: string }
  | { name: 'kate'; prompt?: string; attach?: boolean; document?: string; run?: number }
  | { name: 'settings' }
  | { name: 'messages' }
  | { name: 'transfer'; beneficiaryId?: string; prefill?: TransferPrefill }
  | { name: 'trust' }
  | { name: 'trust-data' }
  | { name: 'invoices' }

/** Values a flow can hand to the transfer form, for example after reading an invoice. */
export type TransferPrefill = { fromId: string; name: string; iban: string; amount: string; message: string }

export type TransferInput = {
  fromId: string
  toName: string
  toIban: string
  amount: number
  message: string
}

type AppState = {
  loggedIn: boolean
  logIn: () => void
  logOut: () => void
  tab: Tab
  setTab: (tab: Tab) => void
  stack: Route[]
  push: (route: Route) => void
  pop: () => void
  popToRoot: () => void
  accounts: Account[]
  transactions: Transaction[]
  makeTransfer: (input: TransferInput) => string
  hideAmounts: boolean
  setHideAmounts: (hide: boolean) => void
  dismissed: ReadonlySet<string>
  dismiss: (id: string) => void
  quickPayOpen: boolean
  setQuickPayOpen: (open: boolean) => void
  toast: string | null
  showToast: (message: string) => void
  incomingCall: boolean
  setIncomingCall: (ringing: boolean) => void
  /** What KBC Trust may use and do. Every check reads these choices. */
  trustControls: TrustControls
  setTrustControls: (update: (prev: TrustControls) => TrustControls) => void
  /** "What KBC Trust did": checks run and changes made, newest first. */
  activity: ActivityEntry[]
  logActivity: (title: string, detail: string) => void
}

const AppContext = createContext<AppState | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [tab, setTabState] = useState<Tab>('home')
  const [stack, setStack] = useState<Route[]>([])
  const [accounts, setAccounts] = useState(initialAccounts)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [hideAmounts, setHideAmounts] = useState(false)
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set())
  const [quickPayOpen, setQuickPayOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [incomingCall, setIncomingCall] = useState(false)
  const [trustControls, setTrustControlsState] = useState(defaultTrustControls)
  const [activity, setActivity] = useState(initialActivity)
  const activityId = useRef(1)
  const toastTimer = useRef<number | undefined>(undefined)

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }, [])

  const setTrustControls = useCallback((update: (prev: TrustControls) => TrustControls) => setTrustControlsState(update), [])
  const logActivity = useCallback((title: string, detail: string) => {
    const id = activityId.current++
    setActivity((prev) => [{ id, when: timeNow(), title, detail }, ...prev])
  }, [])

  const logIn = useCallback(() => setLoggedIn(true), [])
  const setTab = useCallback((next: Tab) => {
    setStack([])
    setTabState(next)
  }, [])
  const push = useCallback((route: Route) => {
    setQuickPayOpen(false)
    setStack((prev) => [...prev, route])
  }, [])
  const popToRoot = useCallback(() => setStack([]), [])

  const makeTransfer = useCallback((input: TransferInput) => {
    const reference = `KBC-${Date.now().toString(36).toUpperCase().slice(-6)}`
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id === input.fromId) return { ...a, balance: a.balance - input.amount }
        // Transfers between own accounts also credit the receiving account.
        if (a.iban === input.toIban) return { ...a, balance: a.balance + input.amount }
        return a
      }),
    )
    setTransactions((prev) => [
      {
        id: reference,
        accountId: input.fromId,
        counterparty: input.toName,
        amount: -input.amount,
        category: 'transfer',
        group: 'Today',
        note: input.message || undefined,
      },
      ...prev,
    ])
    return reference
  }, [])

  const value = useMemo<AppState>(
    () => ({
      loggedIn,
      logIn,
      logOut: () => {
        setLoggedIn(false)
        setStack([])
        setTabState('home')
        setQuickPayOpen(false)
      },
      tab,
      setTab,
      stack,
      push,
      pop: () => setStack((prev) => prev.slice(0, -1)),
      popToRoot,
      accounts,
      transactions,
      makeTransfer,
      hideAmounts,
      setHideAmounts,
      dismissed,
      dismiss: (id) => setDismissed((prev) => new Set(prev).add(id)),
      quickPayOpen,
      setQuickPayOpen,
      toast,
      showToast,
      incomingCall,
      setIncomingCall,
      trustControls,
      setTrustControls,
      activity,
      logActivity,
    }),
    [
      loggedIn,
      logIn,
      tab,
      setTab,
      stack,
      push,
      popToRoot,
      accounts,
      transactions,
      makeTransfer,
      hideAmounts,
      dismissed,
      quickPayOpen,
      toast,
      showToast,
      incomingCall,
      trustControls,
      setTrustControls,
      activity,
      logActivity,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
