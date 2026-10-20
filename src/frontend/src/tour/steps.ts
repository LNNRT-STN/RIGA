import { answerCall, askKate, startDemo } from '@/kbc/demo'
import { resetDemo } from '@/kbc/trust/api'

/** What a step does to the demo next to it. The tour runs it when the step opens, also after Back. */
export type TourContext = {
  /** Opens the partner portal and fills in the demo company, or runs its whole sign-up. */
  showPortal: (action: 'fill' | 'submit' | null) => void
  /** True when the screen is wide enough to show the portal and the phone side by side. */
  roomForBoth: () => boolean
  /** Schedules work that the next step change cancels. */
  later: (ms: number, run: () => void) => void
  /** False once the visitor has moved on, so a slow step doesn't act after the next one started. */
  current: () => boolean
}

export type TourStep = {
  id: string
  chapter?: string
  title: string
  body: string
  enter: (ctx: TourContext) => void | Promise<void>
}

const zonnigQuestion = 'Is zonnigreizen.be real?'

// The partner steps start from a clean backend: the demo company is not yet a partner, so the
// before and after answers differ, and Back then Next can sign it up again.
const freshPartners = () => resetDemo().catch(() => undefined)

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Is this real?',
    body: 'Kate checks invoices, callers and websites inside KBC Mobile, before any money leaves.',
    enter: ({ showPortal }) => showPortal(null),
  },
  {
    id: 'invoice',
    chapter: 'Check before you pay',
    title: 'A fake Proximus invoice',
    body: 'Kate blocks this invoice.',
    enter: ({ showPortal }) => {
      showPortal(null)
      startDemo('invoice-checked')
    },
  },
  {
    id: 'call',
    chapter: 'Stop it as it happens',
    title: 'A deepfake CEO call',
    body: 'KBC Trust spots a deepfake of Laura’s CEO asking for €48,500.00.',
    enter: ({ showPortal, later }) => {
      showPortal(null)
      startDemo('call')
      later(2200, answerCall)
    },
  },
  {
    id: 'supplier',
    chapter: 'Stop it as it happens',
    title: 'A supplier’s new account',
    body: 'KBC stops a €12,480.00 payment, because the new account doesn’t belong to Van Damme Packaging.',
    enter: ({ showPortal }) => {
      showPortal(null)
      startDemo('supplier-review')
    },
  },
  {
    id: 'control',
    chapter: 'Laura stays in control',
    title: 'Laura decides',
    body: 'Laura chooses what KBC Trust may use.',
    enter: ({ showPortal }) => {
      showPortal(null)
      startDemo('control')
    },
  },
  {
    id: 'consent',
    chapter: 'Laura stays in control',
    title: 'Kate asks first',
    body: 'With document checks switched off, Kate asks before she opens an invoice.',
    enter: ({ showPortal }) => {
      showPortal(null)
      startDemo('consent-asked')
    },
  },
  {
    id: 'partner-before',
    chapter: 'Companies join',
    title: 'A website KBC doesn’t know',
    body: 'Kate can’t vouch for zonnigreizen.be, because the company isn’t a KBC partner yet.',
    enter: async ({ showPortal, current }) => {
      showPortal(null)
      // Back to the default choices, so the document setting from the previous step doesn't show here.
      startDemo('home')
      await freshPartners()
      if (current()) askKate(zonnigQuestion)
    },
  },
  {
    id: 'partner-signup',
    chapter: 'Companies join',
    title: 'The company signs up',
    body: 'Zonnig Reizen signs up, and KBC verifies it at once.',
    enter: async ({ showPortal, current }) => {
      await freshPartners()
      if (current()) showPortal('submit')
    },
  },
  {
    id: 'partner-after',
    chapter: 'Companies join',
    title: 'Same question, new answer',
    body: 'Laura asks again, and now Kate confirms the website is real.',
    enter: ({ showPortal, roomForBoth }) => {
      // On narrow screens the portal would hide the phone, and the answer is on the phone.
      if (!roomForBoth()) showPortal(null)
      askKate(zonnigQuestion)
    },
  },
  {
    id: 'finish',
    title: 'That’s KBC Trust',
    body: 'Kate checks against what verified companies registered at KBC, and Laura decides what it may use.',
    enter: ({ showPortal }) => {
      showPortal(null)
      startDemo('home')
    },
  },
]
