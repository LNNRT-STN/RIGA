import { IPhoneFrame } from '@/components/device/iphone-frame'
import { KbcApp } from '@/kbc/kbc-app'

function App() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_50%_35%,#ffffff_0%,#eef3f7_55%,#e2e9ef_100%)] p-6">
      <h1 className="sr-only">KBC Mobile prototype</h1>
      <IPhoneFrame>
        <KbcApp />
      </IPhoneFrame>
    </main>
  )
}

export default App
