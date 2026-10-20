import { useEffect, useRef, useState } from 'react'
import { IPhoneFrame } from '@/components/device/iphone-frame'
import { cn } from '@/lib/utils'
import { askKate, startDemo, type DemoScenario } from '@/kbc/demo'
import { KbcApp } from '@/kbc/kbc-app'
import { PartnerPortal, type PortalTourAction } from '@/partners/portal'
import { GuidedTour, TourButton } from '@/tour/guided-tour'
import { rememberTourClosed, tourWasClosed } from '@/tour/storage'

type Shortcut = { key: string; title: string; detail: string; run: () => void }

const portalHash = '#partners'

function App() {
  const [portalOpen, setPortalOpen] = useState(() => window.location.hash === portalHash)
  // First visitors get the guided tour; a presenter who closed it, or opened #partners, does not.
  const [tourOpen, setTourOpen] = useState(() => window.location.hash !== portalHash && !tourWasClosed())
  const [tourIndex, setTourIndex] = useState(0)
  const [portalAction, setPortalAction] = useState<PortalTourAction>()
  const portalActionId = useRef(0)
  const [tourCardHeight, setTourCardHeight] = useState(0)
  const reserve = tourOpen ? tourCardHeight : 0

  const showPortal = (open: boolean) => {
    setPortalOpen(open)
    window.history.replaceState(null, '', open ? portalHash : window.location.pathname + window.location.search)
  }

  // Key 8 opens and closes the partner portal, key 9 asks Kate about the demo partner. Keys 1 to 7 and 0
  // are handled inside the phone (kbc-app.tsx).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '8') showPortal(!portalOpen)
      if (e.key === '9') askKate('Is zonnigreizen.be real?')
      if (e.key === 'Escape' && portalOpen) showPortal(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const tourContext = {
    showPortal: (action: 'fill' | 'submit' | null) => {
      if (action) setPortalAction({ kind: action, id: ++portalActionId.current })
      showPortal(action !== null)
    },
    // The tour column, the portal and the phone fit next to each other from 1280px.
    roomForBoth: () => window.matchMedia('(min-width: 1280px)').matches,
  }
  const closeTour = () => {
    setTourOpen(false)
    // Give the portal its own demo shortcuts back.
    setPortalAction(undefined)
    rememberTourClosed(true)
  }
  const openTour = () => {
    setTourIndex(0)
    setTourOpen(true)
    rememberTourClosed(false)
  }

  const scenario = (id: DemoScenario) => () => startDemo(id)
  const shortcuts: Shortcut[] = [
    { key: '1', title: 'Fake invoice', detail: 'Laura checks a Proximus invoice in Kate', run: scenario('invoice') },
    { key: '2', title: 'Deepfake CEO call', detail: 'Voice and video check during a call', run: scenario('call') },
    { key: '3', title: 'Supplier account changed', detail: 'Payment stopped before it leaves', run: scenario('supplier') },
    { key: '4', title: 'Customer control', detail: 'What KBC Trust may use, and what it did', run: scenario('control') },
    { key: '5', title: 'Kate asks first', detail: 'Document checks off: Kate asks before reading', run: scenario('consent') },
    { key: '6', title: 'Verified invoice', detail: 'Proximus sealed it, KBC checks the seal', run: scenario('sealed') },
    { key: '7', title: 'Sealed invoice changed', detail: 'Looks perfect, but the IBAN was swapped', run: scenario('tampered') },
    { key: '8', title: 'Partner sign-up', detail: 'A company becomes Verified by KBC', run: () => showPortal(true) },
    { key: '9', title: 'Ask Kate about the partner', detail: 'Is zonnigreizen.be real?', run: () => askKate('Is zonnigreizen.be real?') },
    { key: '0', title: 'Reset demo', detail: 'Clears reports and new partners, reloads', run: scenario('reset') },
  ]

  // The phone keeps the same place in the tree, so opening the portal never resets the app's state.
  return (
    <main
      className={cn(
        'flex min-h-dvh items-center justify-center gap-6 bg-[radial-gradient(ellipse_at_50%_35%,#ffffff_0%,#eef3f7_55%,#e2e9ef_100%)] p-6',
        portalOpen && 'h-dvh',
      )}
      // Below 1024px the tour card floats at the bottom; keep the phone and portal clear of it.
      style={reserve ? { paddingBottom: reserve + 12 } : undefined}
    >
      <h1 className="sr-only">KBC Mobile prototype</h1>
      {tourOpen ? (
        <GuidedTour index={tourIndex} onIndex={setTourIndex} onClose={closeTour} context={tourContext} onCardHeight={setTourCardHeight} />
      ) : (
        <>
          {!portalOpen && <PresenterPanel shortcuts={shortcuts} />}
          <TourButton onClick={openTour} />
        </>
      )}
      {portalOpen && (
        <div className="h-full max-w-[1120px] min-w-0 flex-1">
          <PartnerPortal onClose={() => showPortal(false)} tourAction={portalAction} />
        </div>
      )}
      {/* With the tour open there is room for the portal and the phone together only from 1280px. */}
      <div className={cn(portalOpen && (tourOpen ? 'hidden xl:block' : 'hidden lg:block'))}>
        <IPhoneFrame reserveBottom={reserve}>
          <KbcApp />
        </IPhoneFrame>
      </div>
    </main>
  )
}

/** Shortcuts for the pitch, outside the phone so the app itself stays realistic. Hidden on small screens. */
function PresenterPanel({ shortcuts }: { shortcuts: Shortcut[] }) {
  return (
    <nav
      aria-label="Demo scenarios"
      className="fixed top-1/2 left-6 hidden w-[230px] -translate-y-1/2 rounded-[12px] bg-white/80 p-2 text-kbc-navy shadow-[0_2px_10px_rgba(20,41,77,0.08)] xl:block"
    >
      <p className="px-2 pt-1 pb-2 text-[13px] font-bold text-kbc-muted">KBC Trust demo</p>
      {shortcuts.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={s.run}
          className="flex w-full items-start gap-3 rounded-[8px] px-2 py-2 text-left transition-colors duration-150 hover:bg-kbc-pale"
        >
          <kbd className="mt-[1px] grid size-[22px] shrink-0 place-items-center rounded-[6px] border border-kbc-line bg-white font-sans text-[12px] font-bold">
            {s.key}
          </kbd>
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold">{s.title}</span>
            <span className="block text-[12px] leading-[1.35] text-kbc-muted">{s.detail}</span>
          </span>
        </button>
      ))}
    </nav>
  )
}

export default App
