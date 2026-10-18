import { useState } from 'react'
import {
  ChevronRight,
  Coins,
  CreditCard,
  EyeOff,
  Eye,
  Hexagon,
  LoaderCircle,
  MessageCircleQuestion,
  QrCode,
  SquareArrowRight,
  Wallet,
  Landmark,
  type LucideIcon,
} from 'lucide-react'
import { useApp } from '../store'
import { KateMark, KbcWordmark } from '../ui'

export function LoginScreen() {
  const { logIn, hideAmounts, setHideAmounts, showToast } = useApp()
  const [loading, setLoading] = useState(false)

  const signIn = () => {
    if (loading) return
    setLoading(true)
    window.setTimeout(logIn, 900)
  }

  const quickActions: { label: string; icon: LucideIcon; onClick?: () => void }[] = [
    { label: 'Pay with QR code', icon: QrCode },
    { label: 'Kate Wallet', icon: Wallet },
    { label: 'Receive money', icon: SquareArrowRight },
    { label: 'Kate Coins', icon: Coins },
    {
      label: hideAmounts ? 'Show amounts' : 'Hide amounts',
      icon: hideAmounts ? Eye : EyeOff,
      onClick: () => {
        setHideAmounts(!hideAmounts)
        showToast(hideAmounts ? 'Amounts are visible' : 'Amounts are hidden')
      },
    },
    { label: 'Extra services', icon: Hexagon },
    { label: 'Loyalty cards', icon: CreditCard },
    { label: 'Withdraw cash', icon: Landmark },
  ]

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#33ace2]">
      {/* Campaign artwork stand-in: dusk sky fading into KBC cyan. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,#1d2c3a_0%,#2c3b4c_18%,#6b6470_30%,#b48a7a_36%,#3d4f5f_44%,#24384a_58%,#1f5b82_74%,#33ace2_86%)]"
      />
      <div aria-hidden className="absolute inset-x-0 top-[34%] h-[18%] bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,196,150,0.45),transparent_65%)]" />
      <div aria-hidden className="absolute inset-x-0 top-[47%] h-[30%] bg-[linear-gradient(180deg,transparent,rgba(16,40,52,0.55)_40%,transparent)]" />

      <div className="relative flex items-center justify-between pt-[calc(var(--safe-top)+12px)] pl-4">
        <button
          type="button"
          aria-label="More options"
          className="grid size-[34px] place-items-center rounded-full bg-white text-kbc-navy shadow-md"
        >
          <span className="flex gap-[3px]">
            <span className="size-[4.5px] rounded-full bg-current" />
            <span className="size-[4.5px] rounded-full bg-current" />
            <span className="size-[4.5px] rounded-full bg-current" />
          </span>
        </button>
        <div className="flex h-[50px] items-center gap-3 rounded-l-full bg-[#1f9fe0] pr-6 pl-5 text-white">
          <KbcWordmark className="text-[22px] leading-none" />
          <span className="text-[13px] leading-[1.1] font-bold">
            Moves
            <br />
            with you.
          </span>
        </div>
      </div>

      <div className="relative mt-7 flex gap-3 px-[64px]">
        <KateMark className="mt-1 size-[30px]" />
        <div>
          <h1 className="text-[28px] leading-[1.15] font-bold tracking-[-0.01em] text-white">
            Insure your car without the worry?
          </h1>
          <p className="mt-3 text-[18px] font-semibold text-white/90">No stress. Kate it.</p>
        </div>
      </div>

      <div className="flex-1" />

      <div className="relative flex justify-center pb-8">
        <button
          type="button"
          onClick={signIn}
          className="flex h-[40px] items-center gap-3 rounded-full bg-[#123a5f] pr-4 pl-4 text-[17px] text-white shadow-lg"
        >
          <MessageCircleQuestion className="size-5" strokeWidth={1.5} />
          Check your conversation
          <ChevronRight className="size-4" strokeWidth={2} />
        </button>
      </div>

      <div className="no-scrollbar relative flex snap-x gap-3 overflow-x-auto px-4 pb-8">
        {quickActions.map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="flex h-[96px] w-[80px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-[8px] bg-white px-1 text-center shadow-sm transition-transform duration-150 active:scale-95"
          >
            <Icon className="size-[32px] text-kbc-blue" strokeWidth={1.4} />
            <span className="text-[12px] leading-[1.2] text-kbc-navy">{label}</span>
          </button>
        ))}
      </div>

      <div className="relative flex justify-center pb-[calc(var(--safe-bottom)+30px)]">
        <button
          type="button"
          onClick={signIn}
          disabled={loading}
          className="flex h-[42px] w-[280px] items-center justify-center gap-2 rounded-full bg-white text-[17px] font-semibold text-kbc-link shadow-sm transition-transform duration-150 active:scale-[0.98] disabled:opacity-90"
        >
          {loading ? (
            <>
              <LoaderCircle className="size-5 animate-spin" />
              Logging on
            </>
          ) : (
            'Log on'
          )}
        </button>
      </div>
    </div>
  )
}
