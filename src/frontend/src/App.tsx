import { IPhoneFrame } from '@/components/device/iphone-frame'
import { startDemo, type DemoScenario } from '@/kbc/demo'
import { KbcApp } from '@/kbc/kbc-app'

const scenarios: { id: DemoScenario; key: string; title: string; detail: string }[] = [
  { id: 'invoice', key: '1', title: 'Fake invoice', detail: 'Laura checks a Proximus invoice in Kate' },
  { id: 'call', key: '2', title: 'Deepfake CEO call', detail: 'Voice and video check during a call' },
  { id: 'supplier', key: '3', title: 'Supplier account changed', detail: 'Payment stopped before it leaves' },
  { id: 'control', key: '4', title: 'Customer control', detail: 'What KBC Trust may use, and what it did' },
  { id: 'consent', key: '5', title: 'Kate asks first', detail: 'Document checks off: Kate asks before reading' },
  { id: 'sealed', key: '6', title: 'Verified invoice', detail: 'Proximus sealed it, KBC checks the seal' },
  { id: 'tampered', key: '7', title: 'Sealed invoice changed', detail: 'Looks perfect, but the IBAN was swapped' },
  { id: 'reset', key: '0', title: 'Reset demo', detail: 'Clears reports and reloads' },
]

function App() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_50%_35%,#ffffff_0%,#eef3f7_55%,#e2e9ef_100%)] p-6">
      <h1 className="sr-only">KBC Mobile prototype</h1>
      <PresenterPanel />
      <IPhoneFrame>
        <KbcApp />
      </IPhoneFrame>
    </main>
  )
}

/** Shortcuts for the pitch, outside the phone so the app itself stays realistic. Hidden on small screens. */
function PresenterPanel() {
  return (
    <nav
      aria-label="Demo scenarios"
      className="fixed top-1/2 left-6 hidden w-[230px] -translate-y-1/2 rounded-[12px] bg-white/80 p-2 text-kbc-navy shadow-[0_2px_10px_rgba(20,41,77,0.08)] xl:block"
    >
      <p className="px-2 pt-1 pb-2 text-[13px] font-bold text-kbc-muted">KBC Trust demo</p>
      {scenarios.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => startDemo(s.id)}
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
