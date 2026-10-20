import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// iPhone 16 Pro logical screen size in points.
const SCREEN_W = 393
const SCREEN_H = 852
const BEZEL = 12
const FRAME_W = SCREEN_W + BEZEL * 2
const FRAME_H = SCREEN_H + BEZEL * 2

type DeviceInfo = { framed: boolean }

const DeviceContext = createContext<DeviceInfo>({ framed: true })

export function useDevice() {
  return useContext(DeviceContext)
}

function useFitScale(margin: number) {
  const compute = () =>
    Math.min(1, (window.innerHeight - margin * 2) / FRAME_H, (window.innerWidth - margin * 2) / FRAME_W)
  const [scale, setScale] = useState(compute)
  useEffect(() => {
    const onResize = () => setScale(compute())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  })
  return Math.max(scale, 0.4)
}

function useIsPhone() {
  const query = '(max-width: 520px) and (pointer: coarse)'
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatch(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return match
}

/**
 * Renders children inside a scaled iPhone mockup. On a real phone the frame is dropped and the
 * app fills the viewport, so the same build works for projector demos and hands-on demos.
 */
export function IPhoneFrame({ children }: { children: ReactNode }) {
  const scale = useFitScale(24)
  const isPhone = useIsPhone()

  if (isPhone) {
    return (
      <DeviceContext.Provider value={{ framed: false }}>
        <div
          className="fixed inset-0 overflow-hidden bg-white"
          style={
            {
              '--safe-top': 'env(safe-area-inset-top, 0px)',
              '--safe-bottom': 'env(safe-area-inset-bottom, 0px)',
            } as CSSProperties
          }
        >
          {children}
        </div>
      </DeviceContext.Provider>
    )
  }

  return (
    <DeviceContext.Provider value={{ framed: true }}>
      <div style={{ width: FRAME_W * scale, height: FRAME_H * scale }} className="shrink-0">
        <div
          className="relative origin-top-left rounded-[68px] bg-[#16181c] shadow-[0_0_0_2px_#5b5f66,0_0_0_5px_#2a2d32,0_40px_80px_-20px_rgba(15,35,71,0.45),0_18px_36px_-18px_rgba(15,35,71,0.35)]"
          style={{ width: FRAME_W, height: FRAME_H, padding: BEZEL, transform: `scale(${scale})` }}
        >
          <SideButton side="left" top={150} height={30} />
          <SideButton side="left" top={210} height={62} />
          <SideButton side="left" top={285} height={62} />
          <SideButton side="right" top={240} height={96} />

          <div
            className="relative size-full overflow-hidden rounded-[56px] bg-white [contain:paint]"
            style={{ '--safe-top': '54px', '--safe-bottom': '34px' } as CSSProperties}
          >
            {children}
            <div
              aria-hidden
              className="pointer-events-none absolute top-[11px] left-1/2 z-[70] h-[37px] w-[126px] -translate-x-1/2 rounded-full bg-black"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-[8px] left-1/2 z-[70] h-[5px] w-[139px] -translate-x-1/2 rounded-full bg-black/85"
            />
          </div>
        </div>
      </div>
    </DeviceContext.Provider>
  )
}

function SideButton({ side, top, height }: { side: 'left' | 'right'; top: number; height: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        'absolute w-[4px] bg-[#3a3d43]',
        side === 'left' ? '-left-[6px] rounded-l-[3px]' : '-right-[6px] rounded-r-[3px]',
      )}
      style={{ top, height }}
    />
  )
}

function useClock() {
  const format = () =>
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  const [time, setTime] = useState(format)
  useEffect(() => {
    const id = window.setInterval(() => setTime(format()), 10_000)
    return () => window.clearInterval(id)
  }, [])
  return time
}

/** iOS status bar. Only rendered inside the mockup; a real phone draws its own. */
export function StatusBar({ tone }: { tone: 'dark' | 'light' }) {
  const { framed } = useDevice()
  const time = useClock()
  if (!framed) return null
  const color = tone === 'light' ? 'text-white' : 'text-black'

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-[65] flex h-[54px] items-center justify-between pr-[30px] pl-[50px] pt-[6px] transition-colors duration-200',
        color,
      )}
    >
      <span className="w-[54px] text-center font-sans text-[17px] font-semibold tracking-[-0.01em]">{time}</span>
      <span className="flex items-center gap-[6px]">
        <svg width="19" height="12" viewBox="0 0 19 12" fill="currentColor">
          <rect x="0" y="8" width="3.2" height="4" rx="1" />
          <rect x="5" y="5.5" width="3.2" height="6.5" rx="1" />
          <rect x="10" y="3" width="3.2" height="9" rx="1" />
          <rect x="15" y="0" width="3.2" height="12" rx="1" />
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
          <path d="M8.5 2.4c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8.5.7 10.2 10.2 0 0 0 1.3 3.6l1.2 1.2a8.5 8.5 0 0 1 6-2.4Z" />
          <path d="M8.5 5.8c1.4 0 2.6.5 3.6 1.4l1.2-1.2a6.8 6.8 0 0 0-9.6 0l1.2 1.2c1-.9 2.2-1.4 3.6-1.4Z" />
          <path d="M8.5 9.1c.5 0 .9.2 1.2.5L8.5 10.8 7.3 9.6c.3-.3.7-.5 1.2-.5Z" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="16" height="9" rx="2.5" fill="currentColor" />
          <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" opacity="0.45" />
        </svg>
      </span>
    </div>
  )
}
