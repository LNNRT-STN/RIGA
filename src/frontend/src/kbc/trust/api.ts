// Client for the KBC Trust backend in `src/backend/` (Vite proxies /api to it in development).
// The backend is a rule-based prototype with mocked partner data; see src/backend/README.md.

export type TrustLevel = 'verified' | 'caution' | 'review' | 'danger'
export type TrustDecision = 'allow' | 'warn' | 'review' | 'block'
export type CheckStatus = 'pass' | 'fail' | 'warn'

export type TrustCheck = { id: string; label: string; status: CheckStatus; detail: string }

export type VerifiedContact = {
  name: string
  phone: string
  website: string
  iban: string | null
  verifiedSince: string
}

export type TrustResult = {
  subject: 'invoice' | 'payee' | 'call' | 'website'
  score: number
  level: TrustLevel
  decision: TrustDecision
  verifiedPartner: boolean
  headline: string
  summary: string
  checks: TrustCheck[]
  extracted: Record<string, string> | null
  verifiedContact: VerifiedContact | null
  network: { reports: number; lastReported: string | null } | null
  /** Time from the customer's request to the answer, measured in the app. */
  elapsedMs: number
}

/** A demo document the presenter can pick without hunting through the file system. */
export type DemoDocument = { file: string; title: string; detail: string }

export const demoDocuments: DemoDocument[] = [
  { file: 'proximus-invoice-october.pdf', title: 'Proximus invoice, October', detail: 'PDF from your email · 89.99 EUR' },
  { file: 'proximus-invoice-september.pdf', title: 'Proximus invoice, September', detail: 'PDF from your email · 64.50 EUR' },
]

// Keep each check on screen long enough to read the steps, but well under the 5 second target.
const MIN_CHECK_MS = 1600

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`KBC Trust returned ${response.status}`)
  return (await response.json()) as T
}

/** Waits at least MIN_CHECK_MS and reports the time the customer actually waited for the answer. */
async function paced(work: Promise<TrustResult>): Promise<TrustResult> {
  const started = performance.now()
  const [result] = await Promise.all([work, new Promise((resolve) => window.setTimeout(resolve, MIN_CHECK_MS))])
  return { ...result, elapsedMs: Math.round(performance.now() - started) }
}

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function checkInvoice(source: { sample: string } | { file: File }) {
  const body =
    'sample' in source
      ? { sample: source.sample }
      : { fileName: source.file.name, contentBase64: await toBase64(source.file) }
  return paced(post<TrustResult>('/trust/invoice', body))
}

export function checkPayee(input: { name: string; iban: string; account: 'personal' | 'business' }) {
  return paced(post<TrustResult>('/trust/payee', input))
}

export function checkCall(scenario: 'ceo-deepfake') {
  return paced(post<TrustResult>('/trust/call', { scenario }))
}

export function checkWebsite(url: string) {
  return paced(post<TrustResult>('/trust/website', { url }))
}

export function reportScam(target: { iban: string } | { number: string }) {
  return post<{ reports: number; message: string }>('/trust/report', target)
}

export function resetDemo() {
  return post<{ ok: boolean }>('/demo/reset', {})
}

/** Steps shown while a check runs, so the customer sees what KBC Trust is doing. */
export const checkSteps: Record<TrustResult['subject'], string[]> = {
  invoice: ['Reading the document', 'Comparing with the verified sender', 'Checking reports from KBC customers'],
  payee: ['Checking who owns this account', 'Comparing with your payment history', 'Checking reports from KBC customers'],
  call: ['Checking the caller’s number', 'Analysing voice and video', 'Checking reports from KBC customers'],
  website: ['Checking the web address', 'Comparing with verified partners', 'Checking reports from KBC customers'],
}
