import { StatusBar } from '@/components/device/iphone-frame'
import { AccountScreen, TransferFab } from './screens/account'
import { HomeScreen } from './screens/home'
import { InvestScreen } from './screens/invest'
import { KateScreen } from './screens/kate'
import { LoginScreen } from './screens/login'
import { MyKbcScreen } from './screens/my-kbc'
import { OffersScreen } from './screens/offers'
import { MessagesScreen, SettingsScreen } from './screens/settings'
import { QuickPaySheet, TransferScreen } from './screens/transfer'
import { AppProvider, useApp, type Route } from './store'
import { TabBar } from './ui'

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

function AppContent() {
  const { loggedIn, tab, stack, setQuickPayOpen, toast } = useApp()
  const top = stack.at(-1)
  const lightStatusBar = !loggedIn || top?.name === 'account'

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
      return <KateScreen prompt={route.prompt} />
    case 'settings':
      return <SettingsScreen />
    case 'messages':
      return <MessagesScreen />
    case 'transfer':
      return <TransferScreen beneficiaryId={route.beneficiaryId} />
  }
}
