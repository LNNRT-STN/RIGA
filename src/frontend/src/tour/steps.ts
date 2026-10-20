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
  /** Where to look, so the visitor finds the moment on the phone or in the portal. */
  look?: string
  /** Shown in small print when the step relies on something simulated. */
  note?: string
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
    body: 'Fraudsters copy invoices, voices and websites. KBC Trust lets Kate check them inside KBC Mobile, before any money leaves.',
    enter: ({ showPortal }) => showPortal(null),
  },
  {
    id: 'home',
    chapter: 'Meet Laura',
    title: 'Meet Laura',
    body: 'Laura banks with KBC and pays the bills for Noord Design, a small company. Everything you’ll see runs in the KBC Mobile app she already uses.',
    look: 'MyTrust on Home holds her KBC Trust choices.',
    enter: ({ showPortal }) => {
      showPortal(null)
      startDemo('home')
    },
  },
  {
    id: 'invoice',
    chapter: 'Check before you pay',
    title: 'A fake Proximus invoice',
    body: 'Laura asks Kate whether an invoice in her inbox is real. KBC Trust compares it with what Proximus registered at KBC.',
    look: 'Wrong sender domain, an account 37 customers reported, and the real Proximus number to call.',
    enter: ({ showPortal }) => {
      showPortal(null)
      startDemo('invoice-checked')
    },
  },
  {
    id: 'sealed',
    chapter: 'Check before you pay',
    title: 'A sealed invoice',
    body: 'Proximus signs the payment details of every invoice with its own key. KBC checks that seal, so a genuine invoice is Verified by KBC.',
    look: 'Pay this invoice fills in the transfer for her.',
    enter: ({ showPortal }) => {
      showPortal(null)
      startDemo('sealed')
    },
  },
  {
    id: 'tampered',
    chapter: 'Check before you pay',
    title: 'Changed after sealing',
    body: 'This invoice looks perfect. But someone swapped the account number after Proximus sealed it.',
    look: 'KBC shows the printed and the sealed account number side by side.',
    enter: ({ showPortal }) => {
      showPortal(null)
      startDemo('tampered')
    },
  },
  {
    id: 'call',
    chapter: 'Stop it as it happens',
    title: 'A deepfake CEO call',
    body: 'Laura’s CEO video calls: pay €48,500.00 to a new account today, and keep it quiet. KBC Trust checks the caller during the call.',
    look: 'The warning lands on top of the call, with his real number.',
    note: 'Voice and video analysis is simulated in this prototype.',
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
    body: 'An email says Van Damme Packaging changed banks. When Laura pays their €12,480.00 invoice, KBC checks who owns the new account.',
    look: 'The transfer stops on the review screen, before any money leaves.',
    enter: ({ showPortal }) => {
      showPortal(null)
      startDemo('supplier-review')
    },
  },
  {
    id: 'control',
    chapter: 'Laura stays in control',
    title: 'Laura decides',
    body: 'She chooses what KBC Trust may use, how proactive it is, and which companies may send her invoices. Every check is logged.',
    look: 'Each choice is one switch, and What KBC Trust did lists every check.',
    enter: ({ showPortal }) => {
      showPortal(null)
      startDemo('control')
    },
  },
  {
    id: 'consent',
    chapter: 'Laura stays in control',
    title: 'Kate asks first',
    body: 'Laura switched off document checks. So Kate asks before she opens an invoice: this one only, always, or not now.',
    enter: ({ showPortal }) => {
      showPortal(null)
      startDemo('consent-asked')
    },
  },
  {
    id: 'partner-before',
    chapter: 'Companies join',
    title: 'A website KBC doesn’t know',
    body: 'Laura asks about zonnigreizen.be, a travel agency. It isn’t a KBC partner yet, so Kate can’t vouch for it.',
    look: 'Kate says: we could not verify this website.',
    enter: async ({ showPortal, current }) => {
      showPortal(null)
      await freshPartners()
      if (current()) askKate(zonnigQuestion)
    },
  },
  {
    id: 'partner-signup',
    chapter: 'Companies join',
    title: 'The company signs up',
    body: 'Zonnig Reizen enters its enterprise number. KBC pulls the company register and suggests its website, phone and account.',
    look: 'Next, the company proves its domains and accounts are its own.',
    enter: async ({ showPortal, current }) => {
      await freshPartners()
      if (current()) showPortal('fill')
    },
  },
  {
    id: 'partner-live',
    chapter: 'Companies join',
    title: 'Verified by KBC',
    body: 'Register, account holder, domains and scam reports all check out, so Zonnig Reizen goes live at once.',
    look: 'It also gets an API key to seal its own invoices.',
    enter: async ({ showPortal, current }) => {
      await freshPartners()
      if (current()) showPortal('submit')
    },
  },
  {
    id: 'partner-after',
    chapter: 'Companies join',
    title: 'Same question, new answer',
    body: 'Laura asks again. Now Kate confirms zonnigreizen.be belongs to a company KBC verified.',
    enter: ({ showPortal, roomForBoth }) => {
      // On narrow screens the portal would hide the phone, and the answer is on the phone.
      if (!roomForBoth()) showPortal(null)
      askKate(zonnigQuestion)
    },
  },
  {
    id: 'finish',
    title: 'That’s KBC Trust',
    body: 'Kate checks invoices, callers and websites against what verified companies registered at KBC. Laura decides what it may use.',
    enter: ({ showPortal }) => {
      showPortal(null)
      startDemo('home')
    },
  },
]
