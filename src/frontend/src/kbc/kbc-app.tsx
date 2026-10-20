import { useEffect } from 'react'
import { StatusBar } from '@/components/device/iphone-frame'
import { AccountScreen, TransferFab } from './screens/account'
import { IncomingCall } from './screens/call'
import { HomeScreen } from './screens/home'
import { InvestScreen } from './screens/invest'
import { KateScreen } from './screens/kate'
import { LoginScreen } from './screens/login'
import { MyKbcScreen } from './screens/my-kbc'
import { OffersScreen } from './screens/offers'
import { MessagesScreen, SettingsScreen } from './screens/settings'
import { QuickPaySheet, TransferScreen } from './screens/transfer'
import { InvoicesScreen, TrustScreen } from './screens/trust'
import { AppProvider, useApp, type Route } from './store'
import { TabBar } from './ui'
import { resetDemo } from './trust/api'

import { demoEvent, type DemoScenario } from './demo'

/** The KBC Mobile replica. Renders inside any sized, position:relative container. */
export function KbcApp() {
  return (
    <AppProvider>
      <div className="kbc absolute inset-0 overflow-hidden bg-white">
        <AppContent />
      </div>
    </AppProvider>
  )
}

function useDemoScenarios() {
  const { logIn, setTab, popToRoot, push, setIncomingCall } = useApp()
  useEffect(() => {
    const run = (scenario: DemoScenario) => {
      if (scenario === 'reset') {
        void resetDemo()
          .catch(() => undefined)
          .finally(() => window.location.reload())
        return
      }
      logIn()
      setIncomingCall(false)
      setTab('home')
      popToRoot()
      if (scenario === 'invoice') push({ name: 'kate', attach: true })
      if (scenario === 'call') setIncomingCall(true)
      if (scenario === 'supplier') push({ name: 'invoices' })
    }
    const onEvent = (e: Event) => run((e as CustomEvent<DemoScenario>).detail)
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return
      const keys: Record<string, DemoScenario> = { '1': 'invoice', '2': 'call', '3': 'supplier', '0': 'reset' }
      if (keys[e.key]) run(keys[e.key])
    }
    window.addEventListener(demoEvent, onEvent)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener(demoEvent, onEvent)
      window.removeEventListener('keydown', onKey)
    }
  }, [logIn, setTab, popToRoot, push, setIncomingCall])
}

function AppContent() {
  const { loggedIn, tab, stack, setQuickPayOpen, toast, incomingCall } = useApp()
  const top = stack.at(-1)
  const lightStatusBar = !loggedIn || top?.name === 'account' || incomingCall
  useDemoScenarios()

  return (
    <>
      <StatusBar tone={lightStatusBar ? 'light' : 'dark'} />
      {!loggedIn ? (
        <LoginScreen />
      ) : (
        <>
          <div key={tab} className="absolute inset-0 animate-in duration-200 fade-in">
            {tab === 'home' && <HomeScreen />}
            {tab === 'mykbc' && <MyKbcScreen />}
            {tab === 'invest' && <InvestScreen />}
            {tab === 'offers' && <OffersScreen />}
          </div>
          <TransferFab onClick={() => setQuickPayOpen(true)} />
          <TabBar />
          {stack.map((route, i) => (
            <RouteView key={`${route.name}-${i}`} route={route} />
          ))}
          <QuickPaySheet />
          {incomingCall && <IncomingCall />}
        </>
      )}
      {toast && (
        <div
          role="status"
          className="absolute inset-x-0 bottom-[calc(var(--safe-bottom)+96px)] z-[80] flex animate-in justify-center px-6 duration-200 fade-in slide-in-from-bottom-2"
        >
          <span className="rounded-full bg-kbc-navy px-4 py-[10px] text-center text-[14.5px] text-white shadow-lg">{toast}</span>
        </div>
      )}
    </>
  )
}

function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case 'account':
      return <AccountScreen accountId={route.accountId} />
    case 'kate':
      return <KateScreen prompt={route.prompt} attach={route.attach} />
    case 'settings':
      return <SettingsScreen />
    case 'messages':
      return <MessagesScreen />
    case 'transfer':
      return <TransferScreen beneficiaryId={route.beneficiaryId} prefill={route.prefill} />
    case 'trust':
      return <TrustScreen />
    case 'invoices':
      return <InvoicesScreen />
  }
}
